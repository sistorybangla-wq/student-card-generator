// Utility functions for avatar handling

export interface AvatarResponse {
  success: boolean;
  avatars: string[];
  count: number;
  error?: string;
}

// Fetch available avatars from API
export const getAvailableAvatars = async (): Promise<string[]> => {
  try {
    const response = await fetch('/api/avatars');
    const data: AvatarResponse = await response.json();
    
    if (data.success && data.avatars.length > 0) {
      return data.avatars;
    }
    
    console.warn('No avatars found, using fallback');
    return []; // Return empty array if no avatars found
  } catch (error) {
    console.error('Error fetching avatars:', error);
    return []; // Return empty array on error
  }
};

// Get random avatar from available avatars
export const getRandomAvatar = async (): Promise<string | null> => {
  try {
    const avatars = await getAvailableAvatars();
    
    if (avatars.length === 0) {
      return null;
    }
    
    // Pick random avatar
    const randomIndex = Math.floor(Math.random() * avatars.length);
    const selectedAvatar = avatars[randomIndex];
    
    // Convert to base64
    const base64Avatar = await convertImageToBase64(selectedAvatar);
    return base64Avatar;
    
  } catch (error) {
    console.error('Error getting random avatar:', error);
    return null;
  }
};

// Convert image URL to base64
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS if needed
    
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to base64
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    // Start loading image
    img.src = imageUrl;
  });
};

// Validate if image is valid base64
export const isValidBase64Image = (base64: string): boolean => {
  try {
    // Check if it's a valid data URL
    if (!base64.startsWith('data:image/')) {
      return false;
    }
    
    // Try to create image from base64
    const img = new Image();
    img.src = base64;
    
    return true;
  } catch {
    return false;
  }
};

// Get avatar file extension from path
export const getAvatarExtension = (avatarPath: string): string => {
  const match = avatarPath.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'png';
};
