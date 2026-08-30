import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Path to avatar directory
    const avatarDir = join(process.cwd(), 'public', 'img', 'avatar');
    
    // Read all files in avatar directory
    const files = await readdir(avatarDir);
    
    // Filter only image files
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    
    // Convert to full paths
    const avatarPaths = imageFiles.map(file => `/img/avatar/${file}`);
    
    return NextResponse.json({
      success: true,
      avatars: avatarPaths,
      count: avatarPaths.length
    });
    
  } catch (error) {
    console.error('Error reading avatar directory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read avatar directory',
        avatars: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
