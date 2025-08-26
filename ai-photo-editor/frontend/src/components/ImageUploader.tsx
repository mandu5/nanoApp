import React, { useCallback, useRef } from 'react';

type Props = {
  onFileSelected: (file: File) => void;
  previewUrl?: string | null;
};

export default function ImageUploader({ onFileSelected, previewUrl }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onSelectClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
        onClick={onSelectClick}
      >
        <p className="text-gray-600">Drag and drop an image here, or click to select</p>
      </div>
      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt="Selected preview"
            className="max-h-80 rounded-md shadow"
          />
        </div>
      )}
    </div>
  );
}

