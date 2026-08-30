import { NextRequest, NextResponse } from 'next/server';

// Sample base64 encoded placeholder images (1x1 pixel transparent PNGs)
const sampleFaces = [
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
];

// Reliable student photos from stable sources
const studentPhotos = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1522075469751-3847ae2c9d7c?w=300&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=400&fit=crop&crop=face&auto=format&q=80'
];

// Fallback placeholder images as data URLs
const placeholderImages = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkF2YXRhcjwvdGV4dD48L3N2Zz4=',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlN0dWRlbnQ8L3RleHQ+PC9zdmc+',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBob3RvPC90ZXh0Pjwvc3ZnPg=='
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, age, race, emotion } = body;

    console.log('Load faces request:', { type, age, race, emotion });

    // Select random photos from our collection
    const numberOfPhotos = Math.min(5, studentPhotos.length);
    const selectedPhotos = [];

    // Randomly select photos
    const shuffled = [...studentPhotos].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numberOfPhotos);

    // Add selected photos and ensure we have fallbacks
    for (const photoUrl of selected) {
      selectedPhotos.push(photoUrl);
    }

    // Always add fallback images to ensure we have reliable options
    selectedPhotos.push(...placeholderImages.slice(0, Math.min(3, placeholderImages.length)));

    const response = {
      fc: selectedPhotos,
      status: 'success',
      count: selectedPhotos.length
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Load faces error:', error);
    
    // Return fallback response
    return NextResponse.json({
      fc: sampleFaces,
      status: 'fallback',
      error: 'Using fallback images',
      count: sampleFaces.length
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
