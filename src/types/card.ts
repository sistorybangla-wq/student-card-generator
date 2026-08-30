// Enum for supported card types
export enum CardType {
  BABU_BANARASI_DAS = 'babu_banarasi_das',
  IIT_MADRAS = 'iit_madras'
}

// Enum for form field types
export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  TEL = 'tel',
  DATE = 'date',
  SELECT = 'select',
  FILE = 'file'
}

// Interface for form field configuration
export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
  readonly?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: string; // for date fields
    max?: string; // for date fields
  };
  options?: { value: string; label: string }[]; // for select fields
}

// Interface for validation results
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Interface for text positioning on card
export interface TextPosition {
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  maxWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
}

// Interface for photo positioning on card
export interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

// Interface for card template configuration
export interface CardTemplate {
  id: CardType;
  name: string;
  description: string;
  demoImagePath: string; // Path to demo image in /public/img/demo/
  templateImagePath: string; // Path to actual template in /public/img/phoi/
  dimensions: {
    width: number;
    height: number;
  };
  formFields: FormField[];
  textPositions: Record<string, TextPosition>; // fieldId -> position
  photoPosition: PhotoPosition;
  university: {
    name: string;
    code?: string;
  };
}

// Interface for student data (dynamic based on card type)
export interface StudentData {
  [key: string]: string | null | undefined;
  photo?: string | null;
}

// Interface for card configuration
export interface CardConfig {
  templates: Record<CardType, CardTemplate>;
  defaultCardType: CardType;
}

// Type for card selection
export interface CardSelection {
  cardType: CardType;
  template: CardTemplate;
}

// Interface for form validation result
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Interface for card rendering context
export interface CardRenderContext {
  template: CardTemplate;
  studentData: StudentData;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

// Type for card download options
export interface DownloadOptions {
  format: 'png' | 'jpeg';
  quality?: number; // for jpeg
  filename?: string;
}
