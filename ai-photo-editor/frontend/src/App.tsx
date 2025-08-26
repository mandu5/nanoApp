import React, { useMemo, useState } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import PromptInput from './components/PromptInput';
import EditButton from './components/EditButton';
import ResultDisplay from './components/ResultDisplay';
import axios from 'axios';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backendBaseUrl = useMemo(() => {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  }, []);

  const onFileSelected = (file: File) => {
    setSelectedFile(file);
    setResultBase64(null);
    setErrorMessage(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const onStartEdit = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select an image first.');
      return;
    }
    if (!prompt.trim()) {
      setErrorMessage('Please provide an editing instruction.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResultBase64(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', prompt);

      const response = await axios.post(`${backendBaseUrl}/api/edit-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      const data = response.data;
      if (data && data.image_base64) {
        setResultBase64(data.image_base64);
      } else if (data && data.error) {
        setErrorMessage(data.error);
      } else {
        setErrorMessage('Unexpected response from server.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Request failed.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Photo Editor</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ImageUploader onFileSelected={onFileSelected} previewUrl={previewUrl} />
            <PromptInput value={prompt} onChange={setPrompt} />
            <EditButton onClick={onStartEdit} isLoading={isLoading} disabled={!selectedFile || !prompt} />
            {errorMessage && (
              <div className="text-red-600 text-sm">{errorMessage}</div>
            )}
          </div>
          <div>
            <ResultDisplay imageBase64={resultBase64} />
          </div>
        </div>
        <footer className="mt-12 text-xs text-gray-500">
          Backend: {backendBaseUrl}
        </footer>
      </div>
    </div>
  );
}
