/**
 * @file services/file-storage.ts
 * @description Service for managing file uploads to Firebase Storage (resumes, portfolios, documents)
 */

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage';
import { logger } from '../utils/logger';

// File type configurations
export const FILE_CONFIGS = {
  resume: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    path: 'resumes',
  },
  portfolio: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
    path: 'portfolios',
  },
  profilePhoto: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    path: 'profile-photos',
  },
  certificate: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
    path: 'certificates',
  },
} as const;

export type FileType = keyof typeof FILE_CONFIGS;

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

export interface UploadResult {
  downloadURL: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
  storagePath: string;
}

export interface StoredFile {
  id: string;
  downloadURL: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
  storagePath: string;
}

export interface ValidationError {
  isValid: false;
  error: string;
}

export interface ValidationSuccess {
  isValid: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * FileStorageService - Manages file uploads and downloads with Firebase Storage
 */
export class FileStorageService {
  private storage = getStorage();

  /**
   * Validate file before upload
   */
  validateFile(file: File, fileType: FileType): ValidationResult {
    const config = FILE_CONFIGS[fileType];

    // Check file size
    if (file.size > config.maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${this.formatFileSize(config.maxSize)} limit`,
      };
    }

    // Check file type
    if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${config.allowedExtensions.join(', ')}`,
      };
    }

    // Check file extension
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!(config.allowedExtensions as readonly string[]).includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file extension. Allowed: ${config.allowedExtensions.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    file: File,
    fileType: FileType,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, fileType);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const config = FILE_CONFIGS[fileType];
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      
      // Create storage reference
      const storagePath = `${config.path}/${userId}/${fileName}`;
      const storageRef = ref(this.storage, storagePath);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Track upload progress
      if (onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress,
          });
        });
      }

      // Wait for upload to complete
      await uploadTask;

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      logger.info({ storagePath, fileType }, 'File uploaded successfully');

      return {
        downloadURL,
        fileName,
        fileSize: file.size,
        contentType: file.type,
        uploadedAt: new Date(),
        storagePath,
      };
    } catch (error) {
      logger.error({ error, fileType, userId }, 'File upload failed');
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, storagePath);
      await deleteObject(storageRef);
      logger.info({ storagePath }, 'File deleted successfully');
    } catch (error) {
      logger.error({ error, storagePath }, 'File deletion failed');
      throw error;
    }
  }

  /**
   * Get all files for a user by file type
   */
  async getUserFiles(userId: string, fileType: FileType): Promise<StoredFile[]> {
    try {
      const config = FILE_CONFIGS[fileType];
      const folderPath = `${config.path}/${userId}`;
      const folderRef = ref(this.storage, folderPath);

      // List all files in the folder
      const listResult = await listAll(folderRef);

      // Get metadata and download URLs for each file
      const files = await Promise.all(
        listResult.items.map(async (itemRef) => {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);

          return {
            id: itemRef.name,
            downloadURL,
            fileName: metadata.customMetadata?.originalName || itemRef.name,
            fileSize: metadata.size,
            contentType: metadata.contentType || '',
            uploadedAt: new Date(metadata.timeCreated),
            storagePath: itemRef.fullPath,
          };
        })
      );

      return files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      logger.error({ error, userId, fileType }, 'Failed to get user files');
      throw error;
    }
  }

  /**
   * Get file metadata without downloading
   */
  async getFileMetadata(storagePath: string): Promise<{
    name: string;
    size: number;
    contentType: string;
    timeCreated: Date;
    downloadURL: string;
  }> {
    try {
      const storageRef = ref(this.storage, storagePath);
      const metadata = await getMetadata(storageRef);
      const downloadURL = await getDownloadURL(storageRef);

      return {
        name: metadata.customMetadata?.originalName || metadata.name,
        size: metadata.size,
        contentType: metadata.contentType || '',
        timeCreated: new Date(metadata.timeCreated),
        downloadURL,
      };
    } catch (error) {
      logger.error({ error, storagePath }, 'Failed to get file metadata');
      throw error;
    }
  }

  /**
   * Replace an existing file (delete old, upload new)
   */
  async replaceFile(
    oldStoragePath: string,
    newFile: File,
    fileType: FileType,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Upload new file first
      const uploadResult = await this.uploadFile(newFile, fileType, userId, onProgress);

      // Delete old file after successful upload
      try {
        await this.deleteFile(oldStoragePath);
      } catch (error) {
        logger.warn({
          oldStoragePath,
          error,
        }, 'Failed to delete old file, but new file uploaded successfully');
      }

      return uploadResult;
    } catch (error) {
      logger.error({ error, oldStoragePath, fileType }, 'File replacement failed');
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on content type
   */
  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType === 'application/pdf') return '📄';
    if (contentType.includes('word')) return '📝';
    return '📎';
  }
}

// Singleton instance
let fileStorageServiceInstance: FileStorageService | null = null;

/**
 * Initialize the FileStorageService
 */
export function initializeFileStorageService(): FileStorageService {
  if (!fileStorageServiceInstance) {
    fileStorageServiceInstance = new FileStorageService();
    logger.info('FileStorageService initialized');
  }
  return fileStorageServiceInstance;
}

/**
 * Get the FileStorageService instance
 */
export function getFileStorageService(): FileStorageService {
  if (!fileStorageServiceInstance) {
    throw new Error('FileStorageService not initialized. Call initializeFileStorageService first.');
  }
  return fileStorageServiceInstance;
}
