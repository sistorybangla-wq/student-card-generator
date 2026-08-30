import Joi from 'joi';
import validator from 'validator';
import { FormField, StudentData, ValidationResult } from '@/types/card';

// Custom validation schemas
export const validationSchemas = {
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),

  phone: Joi.string()
    .pattern(/^\+91\s?[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid Indian mobile number (+91XXXXXXXXXX)',
      'string.empty': 'Mobile number is required',
      'any.required': 'Mobile number is required'
    }),

  studentId: Joi.string()
    .alphanum()
    .min(6)
    .max(20)
    .required()
    .messages({
      'string.alphanum': 'Student ID should contain only letters and numbers',
      'string.min': 'Student ID should be at least 6 characters',
      'string.max': 'Student ID should not exceed 20 characters',
      'string.empty': 'Student ID is required',
      'any.required': 'Student ID is required'
    }),

  name: Joi.string()
    .pattern(/^[a-zA-Z\s]+$/)
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Name should contain only letters and spaces',
      'string.min': 'Name should be at least 2 characters',
      'string.max': 'Name should not exceed 50 characters',
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),

  date: Joi.date()
    .max('now')
    .min('1950-01-01')
    .required()
    .messages({
      'date.max': 'Date cannot be in the future',
      'date.min': 'Please enter a valid date',
      'date.base': 'Please enter a valid date',
      'any.required': 'Date is required'
    }),

  address: Joi.string()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.min': 'Address should be at least 10 characters',
      'string.max': 'Address should not exceed 200 characters',
      'string.empty': 'Address is required',
      'any.required': 'Address is required'
    })
};

// Real-time validation function
export function validateField(fieldId: string, value: string, field: FormField): string | null {
  if (!value && field.required) {
    return `${field.label} is required`;
  }

  if (!value) return null; // Skip validation for optional empty fields

  try {
    // Use appropriate schema based on field type or ID
    let schema: Joi.Schema;

    switch (field.type) {
      case 'email':
        schema = validationSchemas.email;
        break;
      case 'tel':
        schema = validationSchemas.phone;
        break;
      case 'date':
        schema = validationSchemas.date;
        break;
      default:
        // Use field-specific validation based on ID
        switch (fieldId) {
          case 'studentId':
          case 'rollNumber':
            schema = validationSchemas.studentId;
            break;
          case 'name':
          case 'studentName':
          case 'fatherName':
          case 'motherName':
            schema = validationSchemas.name;
            break;
          case 'address':
            schema = validationSchemas.address;
            break;
          default:
            // Generic text validation
            schema = Joi.string()
              .min(field.validation?.minLength || 1)
              .max(field.validation?.maxLength || 100)
              .pattern(field.validation?.pattern ? new RegExp(field.validation.pattern) : /.*/)
              .messages({
                'string.min': `${field.label} should be at least ${field.validation?.minLength || 1} characters`,
                'string.max': `${field.label} should not exceed ${field.validation?.maxLength || 100} characters`,
                'string.pattern.base': `${field.label} format is invalid`
              });
        }
    }

    const { error } = schema.validate(value);
    return error ? error.details[0].message : null;
  } catch (error) {
    console.error('Validation error:', error);
    return 'Validation error occurred';
  }
}

// Comprehensive form validation
export function validateForm(studentData: StudentData, formFields: FormField[]): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  formFields.forEach(field => {
    if (field.type === 'file') return; // Skip file validation here

    const value = studentData[field.id] as string || '';
    const error = validateField(field.id, value, field);
    
    if (error) {
      errors[field.id] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
}

// Additional utility functions
export function sanitizeInput(input: string): string {
  return validator.escape(input.trim());
}

export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
}

// Date validation helpers
export function isValidAge(dateOfBirth: string, minAge: number = 16, maxAge: number = 35): boolean {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= minAge && age - 1 <= maxAge;
  }
  
  return age >= minAge && age <= maxAge;
}

// Student ID validation
export function generateStudentIdSuggestion(name: string, year?: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const namePrefix = cleanName.slice(0, 3).toUpperCase();
  const currentYear = year || new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${namePrefix}${currentYear}${randomNum}`;
}
