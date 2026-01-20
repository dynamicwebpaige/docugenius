import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }
    onFileSelect(file);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={`relative w-full h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-8 transition-all duration-300
      ${dragActive ? 'border-primary bg-indigo-50 scale-[1.02]' : 'border-gray-300 bg-white hover:border-gray-400'}
      ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDrag} 
      onDragLeave={handleDrag} 
      onDragOver={handleDrag} 
      onDrop={handleDrop}
    >
      <input 
        ref={inputRef}
        type="file" 
        className="hidden" 
        multiple={false} 
        accept="application/pdf"
        onChange={handleChange} 
      />
      
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        {isProcessing ? (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        ) : (
          <Upload className="w-10 h-10 text-primary" />
        )}
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {isProcessing ? 'Processing Document...' : 'Upload your PDF'}
      </h3>
      <p className="text-gray-500 mb-8 max-w-sm">
        {isProcessing 
          ? 'We are converting your PDF pages and preparing the AI detection engine.' 
          : 'Drag and drop your document here, or click to browse your files.'}
      </p>

      {!isProcessing && (
        <button 
          onClick={onButtonClick}
          className="px-8 py-3 bg-primary text-white rounded-lg font-medium shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
        >
          Select PDF File
        </button>
      )}

      <div className="absolute bottom-6 flex items-center text-xs text-gray-400 gap-2">
        <FileText size={14} />
        <span>Supports PDF files up to 10MB</span>
      </div>
    </div>
  );
};
