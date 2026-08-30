import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ base64: string }> }
) {
  try {
    const { base64 } = await params;

    if (!base64) {
      return new NextResponse('Base64 parameter is required', { status: 400 });
    }

    // Decode URL-encoded base64 string
    const decodedBase64 = decodeURIComponent(base64);

    // Decode the base64 string
    let imageBuffer: Buffer;

    try {
      imageBuffer = Buffer.from(decodedBase64, 'base64');
    } catch (error) {
      console.error('Invalid base64 string:', error);
      return new NextResponse('Invalid base64 string', { status: 400 });
    }

    // Determine content type based on the image header
    let contentType = 'image/png'; // default
    
    // Check for common image formats
    const header = imageBuffer.slice(0, 4);
    if (header[0] === 0xFF && header[1] === 0xD8) {
      contentType = 'image/jpeg';
    } else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      contentType = 'image/png';
    } else if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
      contentType = 'image/gif';
    } else if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      contentType = 'image/webp';
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Image serving error:', error);
    
    // Return a 1x1 transparent PNG as fallback
    const fallbackImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    return new NextResponse(fallbackImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
