"use client";

import type { ChangeEvent } from "react";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
}

export function ImageUpload({ onFileSelect }: ImageUploadProps) {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    event.target.value = "";
  };

  return (
    <label className="uploadButton">
      Add image
      <input type="file" accept="image/*" onChange={onChange} hidden />
    </label>
  );
}
