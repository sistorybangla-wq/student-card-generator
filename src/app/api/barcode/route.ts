import { NextRequest, NextResponse } from 'next/server';

// Code 128 character set mapping (simplified)
const CODE128_PATTERNS: Record<string, string> = {
  '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
  '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
  '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
  'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001000',
  'G': '10011101000', 'H': '10011100010', 'I': '11001110010', 'J': '11001011100',
  'K': '11001001110', 'L': '11011100100', 'M': '11001110100', 'N': '11101101110',
  'O': '11101001100', 'P': '11100101100', 'Q': '11100100110', 'R': '11101100100',
  'S': '11100110100', 'T': '11100110010', 'U': '11011011000', 'V': '11011000110',
  'W': '11000110110', 'X': '10100011000', 'Y': '10001011000', 'Z': '10001000110',
  ' ': '10110001000', '.': '10001101000', '-': '10001100010', '_': '11010001000'
};

const START_PATTERN = '11010000100';
const STOP_PATTERN = '1100011101011';

function generateCode128Pattern(text: string): string {
  // Sanitize input - keep only alphanumeric, spaces, dots, hyphens, underscores
  let sanitized = text.toUpperCase().replace(/[^A-Z0-9 .\-_]/g, '');

  // Ensure minimum length for consistent barcode appearance
  if (sanitized.length < 8) {
    sanitized = sanitized.padEnd(8, 'A');
  }

  // Limit maximum length to prevent overly long barcodes
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20);
  }

  let pattern = START_PATTERN;

  // Add character patterns
  for (const char of sanitized) {
    if (CODE128_PATTERNS[char]) {
      pattern += CODE128_PATTERNS[char];
    } else {
      // Default to 'A' for unknown characters
      pattern += CODE128_PATTERNS['A'];
    }
  }

  // Add stop pattern
  pattern += STOP_PATTERN;

  return pattern;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data') || 'Sample Data';
    // const code = searchParams.get('code') || 'Code128'; // Reserved for future use

    const barcodeWidth = 600;
    const barcodeHeight = 50;
    const barHeight = 35;
    const quietZone = 20;

    // Generate Code 128 pattern
    const pattern = generateCode128Pattern(data);

    // Calculate bar width - ensure minimum width for readability
    const availableWidth = barcodeWidth - (2 * quietZone);
    const idealBarWidth = availableWidth / pattern.length;
    const barWidth = Math.max(2, Math.min(4, idealBarWidth)); // Min 2px, Max 4px

    // Calculate actual barcode width and center it
    const actualBarcodeWidth = pattern.length * barWidth;
    const startX = (barcodeWidth - actualBarcodeWidth) / 2;

    let barcodePattern = '';
    let x = startX;

    // Generate SVG bars based on pattern
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        const y = (barcodeHeight - barHeight) / 2;
        barcodePattern += `<rect x="${x.toFixed(1)}" y="${y}" width="${barWidth}" height="${barHeight}" fill="black"/>`;
      }
      x += barWidth;
    }

    const svg = `
      <svg width="${barcodeWidth}" height="${barcodeHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        ${barcodePattern}
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Barcode generation error:', error);

    // Return a fallback barcode using default pattern
    const fallbackPattern = generateCode128Pattern('ERROR');
    const fallbackWidth = 600;
    const fallbackHeight = 50;
    const fallbackBarHeight = 35;
    const fallbackQuietZone = 20;

    const fallbackAvailableWidth = fallbackWidth - (2 * fallbackQuietZone);
    const fallbackIdealBarWidth = fallbackAvailableWidth / fallbackPattern.length;
    const fallbackBarWidth = Math.max(2, Math.min(4, fallbackIdealBarWidth));

    const fallbackActualWidth = fallbackPattern.length * fallbackBarWidth;
    const fallbackStartX = (fallbackWidth - fallbackActualWidth) / 2;

    let fallbackBarcodePattern = '';
    let fallbackX = fallbackStartX;

    for (let i = 0; i < fallbackPattern.length; i++) {
      if (fallbackPattern[i] === '1') {
        const y = (fallbackHeight - fallbackBarHeight) / 2;
        fallbackBarcodePattern += `<rect x="${fallbackX.toFixed(1)}" y="${y}" width="${fallbackBarWidth}" height="${fallbackBarHeight}" fill="black"/>`;
      }
      fallbackX += fallbackBarWidth;
    }

    const fallbackSvg = `
      <svg width="${fallbackWidth}" height="${fallbackHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        ${fallbackBarcodePattern}
      </svg>
    `;

    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
}
