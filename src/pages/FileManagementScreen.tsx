/**
 * @file pages/FileManagementScreen.tsx
 * @description Screen for managing user files (resumes, portfolios, certificates)
 */

import React, { useState, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { FileList } from '../components/FileList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { getFileStorageService, type StoredFile, type UploadResult } from '../services/file-storage';
import type { UserProfile } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('file-management-screen');

interface FileManagementScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
}

type FileCategory = 'resume' | 'portfolio' | 'certificate';

export const FileManagementScreen: React.FC<FileManagementScreenProps> = ({
  currentUser,
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<FileCategory>('resume');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  // Set page title when component mounts
  React.useEffect(() => {
    document.title = 'File Management - Intervuu';
    return () => {
      document.title = 'Intervuu';
    };
  }, []);

  const fileStorageService = getFileStorageService();

  // Load files for the active category
  useEffect(() => {
    logger.debug({ category: activeCategory }, 'Loading files for category');
    loadFiles();
  }, [activeCategory]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const userFiles = await fileStorageService.getUserFiles(currentUser.id, activeCategory);
      logger.info({ category: activeCategory, fileCount: userFiles.length }, 'Files loaded');
      setFiles(userFiles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('CORS') || errorMessage.includes('preflight')) {
        logger.warn({ error }, 'CORS error loading files - Firebase Storage CORS not configured');
        setFiles([]);
      } else {
        logger.error({ error }, 'Failed to load files');
        console.error('Failed to load files:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (_result: UploadResult) => {
    setShowUploader(false);
    loadFiles(); // Reload file list
  };

  const handleFileDeleted = () => {
    loadFiles(); // Reload file list
  };

  const getCategoryInfo = (category: FileCategory) => {
    switch (category) {
      case 'resume':
        return {
          title: 'Resumes',
          description: 'Upload your resume to share with interviewers',
          icon: '📄',
          color: 'blue',
        };
      case 'portfolio':
        return {
          title: 'Portfolio',
          description: 'Showcase your work with portfolio documents and images',
          icon: '🎨',
          color: 'purple',
        };
      case 'certificate':
        return {
          title: 'Certificates',
          description: 'Upload certificates and credentials',
          icon: '🏆',
          color: 'green',
        };
    }
  };

  const categoryInfo = getCategoryInfo(activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              logger.info({}, 'Back to dashboard clicked');
              onBack();
            }}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">📁</div>
            <div>
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  File Management
                </span>
              </h1>
              <p className="text-xl text-gray-600">Manage your documents and files</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6">
          <div className="flex border-b border-gray-200">
            {(['resume', 'portfolio', 'certificate'] as FileCategory[]).map((category) => {
              const info = getCategoryInfo(category);
              return (
                <button
                  key={category}
                  onClick={() => {
                    logger.debug({ category }, 'Category tab clicked');
                    setActiveCategory(category);
                    setShowUploader(false);
                  }}
                  className={`
                    flex-1 px-6 py-4 text-center font-semibold transition-all duration-200
                    ${activeCategory === category
                      ? `text-${info.color}-600 border-b-2 border-${info.color}-600 bg-${info.color}-50`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-2xl mr-2">{info.icon}</span>
                  {info.title}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Category Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {categoryInfo.icon} {categoryInfo.title}
                  </h2>
                  <p className="text-gray-600">{categoryInfo.description}</p>
                </div>
                <Button
                  onClick={() => setShowUploader(!showUploader)}
                  disabled={isLoading}
                >
                  {showUploader ? 'Cancel' : '+ Upload File'}
                </Button>
              </div>
            </div>

            {/* File Uploader */}
            {showUploader && (
              <div className="mb-6">
                <FileUploader
                  fileType={activeCategory}
                  userId={currentUser.id}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    alert(`Upload failed: ${error.message}`);
                  }}
                />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="lg" message="Loading files..." />
              </div>
            )}

            {/* CORS Warning */}
            {!isLoading && files.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">📂</div>
                <h3 className="font-semibold text-gray-800 mb-2">No files yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't uploaded any {categoryInfo.title.toLowerCase()} yet.
                </p>
                <Button
                  onClick={() => setShowUploader(true)}
                  className="mx-auto"
                >
                  + Upload {categoryInfo.title}
                </Button>
              </div>
            )}

            {/* File List */}
            {!isLoading && files.length > 0 && (
              <FileList
                files={files}
                onFileDeleted={handleFileDeleted}
                allowDelete={true}
              />
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="font-semibold text-gray-800 mb-1">Quick Tip</h3>
            <p className="text-sm text-gray-600">
              Keep your resume updated to make the best impression on interviewers
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-800 mb-1">Secure Storage</h3>
            <p className="text-sm text-gray-600">
              All files are securely stored and only accessible to you
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 mb-1">File Limits</h3>
            <p className="text-sm text-gray-600">
              Resume: 5MB • Portfolio: 10MB • Certificate: 5MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
