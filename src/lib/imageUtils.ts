import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * Compress image file before upload
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1, // 1MB max
    maxWidthOrHeight: 800, // Max dimension
    useWebWorker: true,
    quality: 0.8, // 80% quality
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    
    console.log('Image compression:', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
    });
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Convert file to base64 with compression
 */
export async function fileToBase64WithCompression(
  file: File,
  options?: ImageCompressionOptions
): Promise<string> {
  const compressedFile = await compressImage(file, options);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(compressedFile);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB before compression
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)',
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size should be less than 10MB',
    };
  }
  
  return { isValid: true };
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}
