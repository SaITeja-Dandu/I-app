/**
 * @file components/FileUploader.tsx
 * @description Reusable file upload component with drag-and-drop, progress tracking, and validation
 */

import React, { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Button } from './Button';
import { Progress } from './Progress';
import { Alert } from './Alert';
import { getFileStorageService, type FileType, type UploadProgress, type UploadResult } from '../services/file-storage';

interface FileUploaderProps {
  fileType: FileType;
  userId: string;
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  existingFile?: {
    fileName: string;
    downloadURL: string;
    storagePath: string;
  };
  disabled?: boolean;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  fileType,
  userId,
  onUploadComplete,
  onUploadError,
  existingFile,
  disabled = false,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileStorageService = getFileStorageService();

  // Get file type configuration
  const fileConfig = fileStorageService['validateFile'](new File([], 'test'), fileType);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file
    const validation = fileStorageService.validateFile(file, fileType);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress({ bytesTransferred: 0, totalBytes: selectedFile.size, progress: 0 });

    try {
      let result: UploadResult;

      if (existingFile) {
        // Replace existing file
        result = await fileStorageService.replaceFile(
          existingFile.storagePath,
          selectedFile,
          fileType,
          userId,
          (progress) => setUploadProgress(progress)
        );
      } else {
        // Upload new file
        result = await fileStorageService.uploadFile(
          selectedFile,
          fileType,
          userId,
          (progress) => setUploadProgress(progress)
        );
      }

      onUploadComplete(result);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${selectedFile ? 'bg-green-50 border-green-400' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept={fileConfig.isValid ? '' : fileType === 'resume' ? '.pdf,.doc,.docx' : fileType === 'portfolio' ? '.pdf,.png,.jpg,.jpeg' : fileType === 'profilePhoto' ? '.png,.jpg,.jpeg,.webp' : '.pdf,.png,.jpg,.jpeg'}
          disabled={disabled}
        />

        <div className="space-y-3">
          {selectedFile ? (
            <>
              <div className="text-4xl">✅</div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {fileStorageService.formatFileSize(selectedFile.size)}
                </p>
              </div>
            </>
          ) : existingFile ? (
            <>
              <div className="text-4xl">📎</div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{existingFile.fileName}</p>
                <p className="text-sm text-gray-600">Click to replace file</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl">📤</div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Drag and drop your file here
                </p>
                <p className="text-sm text-gray-600">or click to browse</p>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Allowed: {fileType === 'resume' ? 'PDF, DOC, DOCX' : fileType === 'portfolio' ? 'PDF, PNG, JPG' : fileType === 'profilePhoto' ? 'PNG, JPG, WEBP' : 'PDF, PNG, JPG'}</p>
                <p>Max size: {fileType === 'resume' ? '5MB' : fileType === 'portfolio' ? '10MB' : fileType === 'profilePhoto' ? '2MB' : '5MB'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress && (
        <div className="space-y-2">
          <Progress value={uploadProgress.progress} />
          <p className="text-sm text-gray-600 text-center">
            Uploading... {uploadProgress.progress.toFixed(0)}%
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Action Buttons */}
      {selectedFile && !isUploading && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
          >
            {existingFile ? 'Replace File' : 'Upload File'}
          </Button>
        </div>
      )}

      {/* Existing File Actions */}
      {existingFile && !selectedFile && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => window.open(existingFile.downloadURL, '_blank')}
          >
            View File
          </Button>
        </div>
      )}
    </div>
  );
};
