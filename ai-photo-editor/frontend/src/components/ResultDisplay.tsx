import React from 'react';

type Props = {
  imageBase64?: string | null;
};

export default function ResultDisplay({ imageBase64 }: Props) {
  if (!imageBase64) return null;

  const dataUrl = `data:image/png;base64,${imageBase64}`;

  const onDownload = () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-6">
      <img src={dataUrl} alt="Edited result" className="max-h-96 rounded-md shadow" />
      <div className="mt-3">
        <button
          onClick={onDownload}
          className="px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
        >
          Download Image
        </button>
      </div>
    </div>
  );
}

