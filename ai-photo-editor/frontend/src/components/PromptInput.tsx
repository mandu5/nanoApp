import React from 'react';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function PromptInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Editing instruction
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Change the background to a blue sky; Remove the car from the photo; Apply a watercolor style"
        className="w-full h-28 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

