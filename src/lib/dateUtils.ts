import { format, addYears, subYears, isValid, parseISO } from 'date-fns';

/**
 * Generate a random date of birth for a student (18-25 years old)
 */
export function generateRandomDateOfBirth(): string {
  const now = new Date();
  const minAge = 18;
  const maxAge = 25;
  
  const minDate = subYears(now, maxAge);
  const maxDate = subYears(now, minAge);
  
  const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
  const randomDate = new Date(randomTime);
  
  return format(randomDate, 'yyyy-MM-dd');
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  
  if (!isValid(birthDate)) {
    return 0;
  }
  
  const now = new Date();
  const age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  
  return age;
}

/**
 * Generate card issue date (today)
 */
export function generateIssueDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Generate card expiry date (4 years from issue date)
 */
export function generateExpiryDate(issueDate?: string): string {
  const baseDate = issueDate ? parseISO(issueDate) : new Date();
  const expiryDate = addYears(baseDate, 4);
  return format(expiryDate, 'yyyy-MM-dd');
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateString: string, formatString: string = 'dd/MM/yyyy'): string {
  const date = parseISO(dateString);
  
  if (!isValid(date)) {
    return dateString; // Return original if invalid
  }
  
  return format(date, formatString);
}

/**
 * Generate academic year based on current date
 */
export function generateAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Academic year typically starts in July/August
  if (currentMonth >= 6) { // July onwards
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

/**
 * Generate random enrollment year (1-4 years ago)
 */
export function generateEnrollmentYear(): string {
  const now = new Date();
  const yearsAgo = Math.floor(Math.random() * 4) + 1; // 1-4 years ago
  const enrollmentYear = now.getFullYear() - yearsAgo;
  return enrollmentYear.toString();
}
