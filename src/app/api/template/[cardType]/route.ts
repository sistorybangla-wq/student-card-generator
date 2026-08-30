import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { CardType } from '@/types/card';
import { cardConfig } from '@/config/cardTemplates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardType: string }> }
) {
  try {
    const { cardType } = await params;

    // Validate card type
    if (!Object.values(CardType).includes(cardType as CardType)) {
      return NextResponse.json(
        { error: 'Invalid card type' },
        { status: 400 }
      );
    }

    // Get template configuration
    const template = cardConfig.templates[cardType as CardType];
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get the actual template file path from config
    const templateFileName = template.templateImagePath.split('/').pop();
    const templatePath = join(process.cwd(), 'public', 'img', 'phoi', templateFileName!);

    try {
      // Read the template file
      const imageBuffer = await readFile(templatePath);

      // Return the image with appropriate headers
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Content-Length': imageBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      console.error('Error reading template file:', fileError);
      return NextResponse.json(
        { error: 'Template image not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error serving template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add HEAD method for checking if template exists
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ cardType: string }> }
) {
  try {
    const { cardType } = await params;

    // Validate card type
    if (!Object.values(CardType).includes(cardType as CardType)) {
      return new NextResponse(null, { status: 400 });
    }

    // Get template configuration
    const template = cardConfig.templates[cardType as CardType];
    if (!template) {
      return new NextResponse(null, { status: 404 });
    }

    // Get the actual template file path from config
    const templateFileName = template.templateImagePath.split('/').pop();
    const templatePath = join(process.cwd(), 'public', 'img', 'phoi', templateFileName!);

    try {
      // Check if file exists by trying to read its stats
      const imageBuffer = await readFile(templatePath);
      
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length.toString(),
        },
      });
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
