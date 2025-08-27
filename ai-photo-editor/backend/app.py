import base64
import io
import os
from pathlib import Path
from typing import Optional

from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv

try:
    from google import generativeai as genai
except Exception:  # pragma: no cover
    genai = None


def load_environment_variables() -> None:
    # Try to load from project root .env if available
    project_root_env = Path(__file__).resolve().parents[1] / ".env"
    if project_root_env.exists():
        load_dotenv(dotenv_path=project_root_env)
    else:
        load_dotenv()  # fallback to default search


def configure_gemini(api_key: Optional[str]) -> None:
    if genai is None:
        raise RuntimeError("google-generativeai library is not installed.")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    genai.configure(api_key=api_key)


def create_app() -> Flask:
    load_environment_variables()

    app = Flask(__name__)

    # CORS configuration
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    CORS(app, resources={r"/api/*": {"origins": [frontend_origin, "*"]}})

    model_name = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-preview")

    @app.route("/api/health", methods=["GET"])
    def health() -> tuple:
        return jsonify({"status": "ok"}), 200

    @app.route("/api/edit-image", methods=["POST"])
    def edit_image():
        try:
            if "image" not in request.files:
                return jsonify({"error": "Missing image file in 'image' field"}), 400
            prompt = request.form.get("prompt", "").strip()
            if not prompt:
                return jsonify({"error": "Missing prompt field"}), 400

            image_file = request.files["image"]
            if image_file.filename == "":
                return jsonify({"error": "Empty filename"}), 400

            # Read image into PIL
            try:
                image_bytes = image_file.read()
                pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            except Exception:
                return jsonify({"error": "Invalid image file"}), 400

            # Configure Gemini
            try:
                configure_gemini(os.getenv("GEMINI_API_KEY"))
            except Exception as e:
                return jsonify({"error": f"Gemini configuration error: {str(e)}"}), 500

            # Build structured prompt
            system_instruction = (
                "Edit the following image according to this instruction. "
                "Return only the edited image without captions or text."
            )
            full_prompt = f"{system_instruction}\nInstruction: {prompt}"

            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([full_prompt, pil_image])
            except Exception as e:
                return jsonify({"error": f"Gemini API error: {str(e)}"}), 502

            # Parse response for image data
            edited_image_base64: Optional[str] = None
            try:
                if response and getattr(response, "candidates", None):
                    for candidate in response.candidates:
                        if not getattr(candidate, "content", None):
                            continue
                        for part in candidate.content.parts:
                            # inline_data may contain image bytes
                            inline_data = getattr(part, "inline_data", None)
                            if inline_data and getattr(inline_data, "mime_type", "").startswith("image/"):
                                data = inline_data.data
                                edited_image_base64 = data if isinstance(data, str) else base64.b64encode(data).decode("utf-8")
                                break
                        if edited_image_base64:
                            break
            except Exception:
                # Fallthrough to try text->data URL if model returned a link or text
                pass

            if not edited_image_base64:
                # As a fallback, if the model returned text content that might be a data URL, attempt to parse
                try:
                    text = getattr(response, "text", None) or ""
                    if text.startswith("data:image"):
                        # Extract after comma
                        edited_image_base64 = text.split(",", 1)[1]
                except Exception:
                    pass

            if not edited_image_base64:
                return jsonify({"error": "Model did not return an image. Try rephrasing the instruction."}), 502

            return jsonify({"image_base64": edited_image_base64}), 200
        except Exception as e:
            return jsonify({"error": f"Unexpected server error: {str(e)}"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)

