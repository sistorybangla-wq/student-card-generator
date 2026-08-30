# 🎓 Multi-University Student ID Card Generator

A modern, AI-powered web application for generating professional student ID cards for multiple universities. Built with Next.js 15, React 19, and Google Gemini AI.

## ✨ Features

### 🎨 Card Template System
- **Multiple Templates**: Support for Babu Banarasi Das University and IIT Madras card layouts
- **Dynamic Form Fields**: Form fields adapt based on selected university template
- **Canvas-based Rendering**: High-quality card generation using HTML5 Canvas
- **Real-time Preview**: See the generated card in real-time as you input data

### 🤖 AI-Powered Generation
- **Smart Data Generation**: Uses Google Gemini 2.5 Flash API to generate realistic student data
- **University-Specific Data**: Generates appropriate data based on selected university
- **Intelligent Field Mapping**: Automatically fills appropriate fields based on template requirements
- **Fallback Data Generation**: Ensures all required fields are populated

### 🔧 Advanced Features
- **Real-time Form Validation**: Using Joi schemas for robust data validation
- **Photo Upload & Compression**: Automatic image optimization using browser-image-compression
- **Multiple Export Formats**: Download cards as PNG or PDF using html2canvas-pro and jsPDF
- **Barcode Generation**: Dynamic barcode creation for student IDs
- **Theme Support**: Light/dark mode with system preference detection using next-themes
- **Browser Extension Integration**: Send generated data directly to Chrome extension
- **Date Utilities**: Smart date generation and formatting with date-fns

### 🎯 Quick Card Generator (/card-generator)
- **One-Click Generation**: Generate complete student cards with a single click
- **10+ Indian Universities**: IIT Bombay, Delhi, Madras, Kanpur, Kharagpur, IISc, DU, JNU, IIM Ahmedabad, BHU
- **Random Student Photos**: Integration with avatar APIs for realistic photos
- **Instant Download**: Download cards immediately
- **Professional Layout**: Clean, modern card design with barcode generation

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: React 19.1.0, Next.js 15.4.2, TypeScript 5
- **Styling**: TailwindCSS 4, Shadcn UI Components
- **AI Integration**: Google Gemini 2.5 Flash API
- **Image Processing**: HTML5 Canvas, html2canvas-pro, jsPDF, browser-image-compression
- **Notifications**: Sonner (Toast notifications)

### Dependencies

- **UI Components**: Radix UI primitives (dropdown-menu, label, progress, radio-group, select, slot, switch)
- **Form Validation**: Joi, Validator.js
- **Date Handling**: date-fns
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Add your Google Gemini API key to `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Routes

- `/` - Advanced Card Generator (main page with AI and form-based generation)
- `/card-generator` - Quick Card Generator (one-click generation with random data)

## API Endpoints

- `/api/avatars` - Get available avatar images from the server
- `/api/barcode` - Generate SVG barcodes for student cards
- `/api/demo/[cardType]` - Serve demo images for card templates
- `/api/image/[base64]` - Serve base64 encoded images with proper headers
- `/api/load-faces` - Get random student photos from Random User API
- `/api/template/[cardType]` - Serve actual card template images (secure)

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env.local` file

## Usage

### Card Template Selection
1. Choose from available university templates
2. Each template has different form fields and layouts

### Manual Entry
1. Select a university card template
2. Fill in the student information form (fields vary by template)
3. Upload a student photo (optional)
4. See the real-time preview
5. Download the generated card

### Auto-Generate
1. Select a university template
2. Click "Auto Generate" button
3. AI generates realistic data based on template
4. Review and modify if needed
5. Download the completed card

## Supported Universities

### Babu Banarasi Das University
- **Fields**: Student Name, Father's Name, Mobile Number, Batch Year
- **Template**: Traditional Indian university card design

### Indian Institute of Technology Madras
- **Fields**: Name, Date of Birth, Enrollment No, Department, Address, Date of Issue, Valid Until
- **Template**: Modern IIT card design

## Adding New Universities

The system is designed to be easily extensible. To add a new university:

1. **Add Images**:
   - Add demo image to `public/img/demo/` (for user selection)
   - Add template image to `public/img/phoi/` (for actual rendering)

2. **Update Configuration**:
   - Add new `CardType` enum value in `src/types/card.ts`
   - Add new template configuration in `src/config/cardTemplates.ts`
   - Define form fields, text positions, and photo positioning

3. **Template Configuration Structure**:
   ```typescript
   {
     id: CardType.YOUR_UNIVERSITY,
     name: 'University Name',
     description: 'Description',
     demoImagePath: '/img/demo/your-card.png',
     templateImagePath: '/img/phoi/your-card.png',
     dimensions: { width: 800, height: 500 },
     formFields: [...], // Define required fields
     textPositions: {...}, // Define text positioning
     photoPosition: {...} // Define photo positioning
   }
   ```

4. The system will automatically:
   - Show the new template in card selector
   - Generate appropriate forms
   - Handle data validation
   - Render cards with correct positioning

## Architecture

### Key Components

- **CardSelector**: Allows users to choose university templates
- **StudentForm**: Dynamic form that adapts to selected template
- **CardPreview**: Canvas-based card rendering with real-time preview
- **StudentCardGenerator**: Main orchestrator component

### Security Features

- Template images served via secure API routes (`/api/template/[cardType]`)
- Demo images publicly accessible for selection
- Template images in `phoi` folder protected from direct access

### Data Flow

1. User selects card template → CardSelector
2. Form fields update → StudentForm (dynamic based on template)
3. User fills data → Real-time validation
4. Canvas renders card → CardPreview (using template config)
5. User downloads → High-quality PNG export

## Chrome Extension

This project includes a Chrome extension (`ExtensionGetStudent/`) that automatically verifies student eligibility for Google One Student and fills SheerID forms. The extension is a separate component that can work alongside the web app.

See `ExtensionGetStudent/README.md` for installation and usage instructions.

## Troubleshooting

1. **API Key Error**: Check your Gemini API key in `.env.local`
2. **Template Not Loading**: Ensure template images are in `public/img/phoi/` folder
3. **Build Errors**: Verify all dependencies are installed
