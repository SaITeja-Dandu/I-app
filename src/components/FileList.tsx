/**
 * @file components/FileList.tsx
 * @description Display list of uploaded files with actions (view, download, delete)
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { getFileStorageService, type StoredFile } from '../services/file-storage';

interface FileListProps {
  files: StoredFile[];
  onFileDeleted?: (storagePath: string) => void;
  allowDelete?: boolean;
  className?: string;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onFileDeleted,
  allowDelete = true,
  className = '',
}) => {
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const fileStorageService = getFileStorageService();

  const handleDelete = async (file: StoredFile) => {
    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      return;
    }

    setDeletingFile(file.id);
    try {
      await fileStorageService.deleteFile(file.storagePath);
      if (onFileDeleted) {
        onFileDeleted(file.storagePath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingFile(null);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (files.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">📂</div>
        <p className="text-gray-600 text-lg">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="text-4xl flex-shrink-0">
              {fileStorageService.getFileIcon(file.contentType)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {file.fileName}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span>{fileStorageService.formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>

                {/* File Type Badge */}
                <Badge 
                  variant="info"
                  label={file.contentType.includes('pdf') ? 'PDF' :
                         file.contentType.includes('word') ? 'Word' :
                         file.contentType.includes('image') ? 'Image' : 'File'}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(file.downloadURL, '_blank')}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = file.downloadURL;
                    link.download = file.fileName;
                    link.click();
                  }}
                >
                  Download
                </Button>
                {allowDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(file)}
                    disabled={deletingFile === file.id}
                  >
                    {deletingFile === file.id ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
