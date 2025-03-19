import React, { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';

interface FileUploadProps {
  id: string;
  name: string;
  label: string;
  accept: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  files: File[] | null;
  maxSize?: string;
  maxFiles?: number;
  onRemove?: (fileName: string) => void;
  isAnalyzing?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
}

const UploadIcon = () => (
  <svg
    className="w-8 h-8 mb-3 text-gray-500"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 20 16"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
    />
  </svg>
);

const FileIcon = () => (
  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UploadText: React.FC<{ isMobile: boolean; accept: string; maxSize: string; maxFiles: number }> = ({ 
  isMobile, accept, maxSize, maxFiles 
}) => (
  <div className="text-center">
    <p className="mb-1 text-sm text-gray-500">
      <span className="font-semibold">{isMobile ? "Tap to upload" : "Click to upload or drag and drop"}</span>
    </p>
    <p className="text-xs text-gray-500">
      {accept.toUpperCase().replace(/,/g, ' or ')} (MAX. {maxSize})
    </p>
    <p className="text-xs text-gray-400 mt-1">
      Up to {maxFiles} files
    </p>
  </div>
);

const FilePreview: React.FC<{ 
  file: FileWithPreview; 
  onRemove: () => void;
}> = ({ file, onRemove }) => (
  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
    {file.preview ? (
      <Image
        src={file.preview}
        alt={`Preview ${file.name}`}
        width={48}
        height={48}
        className="object-cover rounded"
      />
    ) : (
      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
        <FileIcon />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <p className="mt-2 text-sm text-gray-500">Analyzing...</p>
  </div>
);

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  name,
  label,
  accept,
  required = false,
  onChange,
  files: propFiles,
  maxSize = "5MB",
  maxFiles = 3,
  onRemove,
  isAnalyzing = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  useEffect(() => {
    if (propFiles?.length) {
      const filesWithPreviews = propFiles.map(file => {
        const fileWithPreview = file as FileWithPreview;
        if (accept.includes('image') && !fileWithPreview.preview) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        return fileWithPreview;
      });
      setFiles(filesWithPreviews);
    } else {
      setFiles([]);
    }

    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [propFiles, accept]);

  const createSyntheticEvent = (selectedFiles: File[] | null) => ({
    target: {
      files: selectedFiles,
      name,
      type: 'file',
      value: selectedFiles?.length ? undefined : ''
    }
  } as unknown as React.ChangeEvent<HTMLInputElement>);

  const handleFiles = (newFiles: File[]) => {
    if (newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      // Reset file input
      const fileInput = document.getElementById(id) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      return;
    }

    // Check file size
    const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`File size must not exceed ${maxSize}. The following files are too large:\n${oversizedFiles.map(f => f.name).join('\n')}`);
      // Reset file input
      const fileInput = document.getElementById(id) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      return;
    }

    const validFiles = newFiles.filter(file => {
      const fileType = `.${file.name.split('.').pop()?.toLowerCase()}`;
      return accept.split(',').map(type => type.trim()).includes(fileType);
    });

    if (validFiles.length) {
      onChange(createSyntheticEvent(validFiles));
    } else {
      alert(`Please upload valid file types (${accept})`);
      // Reset file input
      const fileInput = document.getElementById(id) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    if ((fileToRemove as FileWithPreview).preview) {
      URL.revokeObjectURL((fileToRemove as FileWithPreview).preview!);
    }
    const updatedFiles = files.filter(f => f !== fileToRemove);
    onChange(createSyntheticEvent(updatedFiles.length ? updatedFiles : null));
    if (onRemove) {
      onRemove(fileToRemove.name);
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-dark">{label}</label>
      <div
        className="flex items-center justify-center w-full"
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
      >
        <label
          htmlFor={id}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 
            ${isDragging ? 'border-blue bg-blue-50' : 'border-gray-300'}
            ${isMobile ? 'border-solid' : 'border-dashed'}
            rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isAnalyzing ? (
              <LoadingSpinner />
            ) : (
              <>
                <UploadIcon />
                <UploadText isMobile={isMobile} accept={accept} maxSize={maxSize} maxFiles={maxFiles} />
              </>
            )}
          </div>
          <input
            id={id}
            name={name}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            required={required}
            multiple={maxFiles > 1}
            disabled={isAnalyzing}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <FilePreview 
              key={index} 
              file={file} 
              onRemove={() => handleRemoveFile(file)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}; 