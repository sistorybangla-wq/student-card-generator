"use client"

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { FormField, StudentData, ValidationResult } from "@/types/card";
import { validateField, validateForm, sanitizeInput, formatPhoneNumber } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface EnhancedFormProps {
  formFields: FormField[];
  studentData: StudentData;
  onDataChange: (data: StudentData) => void;
  onValidationChange?: (result: ValidationResult) => void;
  className?: string;
}

export function EnhancedForm({ 
  formFields, 
  studentData, 
  onDataChange, 
  onValidationChange,
  className 
}: EnhancedFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});

  // Debounced validation
  const validateFieldDebounced = useCallback(
    (fieldId: string, value: string, field: FormField) => {
      setValidating(prev => ({ ...prev, [fieldId]: true }));
      
      setTimeout(() => {
        const error = validateField(fieldId, value, field);
        setErrors(prev => ({
          ...prev,
          [fieldId]: error || ''
        }));
        setValidating(prev => ({ ...prev, [fieldId]: false }));
      }, 300);
    },
    []
  );

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: string, field: FormField) => {
    // Sanitize input
    const sanitizedValue = sanitizeInput(value);
    
    // Format specific fields
    let formattedValue = sanitizedValue;
    if (field.type === 'tel') {
      formattedValue = formatPhoneNumber(sanitizedValue);
    }

    // Update data
    onDataChange({
      ...studentData,
      [fieldId]: formattedValue
    });

    // Mark as touched
    setTouched(prev => ({ ...prev, [fieldId]: true }));

    // Validate if touched
    if (touched[fieldId] || value.length > 0) {
      validateFieldDebounced(fieldId, formattedValue, field);
    }
  }, [studentData, onDataChange, touched, validateFieldDebounced]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldId: string, field: FormField) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    const value = (studentData[fieldId] as string) || '';
    const error = validateField(fieldId, value, field);
    setErrors(prev => ({
      ...prev,
      [fieldId]: error || ''
    }));
  }, [studentData]);

  // Validate entire form
  useEffect(() => {
    const result = validateForm(studentData, formFields);
    onValidationChange?.(result);
  }, [studentData, formFields, onValidationChange]);

  // Get field status
  const getFieldStatus = (fieldId: string) => {
    const hasError = errors[fieldId] && touched[fieldId];
    const isValid = !errors[fieldId] && touched[fieldId] && studentData[fieldId];
    const isValidating = validating[fieldId];

    return { hasError, isValid, isValidating };
  };

  // Render field icon
  const renderFieldIcon = (fieldId: string) => {
    const { hasError, isValid, isValidating } = getFieldStatus(fieldId);

    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (hasError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (isValid) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Fill in the details below. Fields marked with * are required.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {formFields.map((field) => {
          if (field.type === 'file') return null; // Skip file fields for now

          const { hasError, isValid } = getFieldStatus(field.id);
          const fieldValue = (studentData[field.id] as string) || '';

          return (
            <div key={field.id} className="space-y-2">
              <Label 
                htmlFor={field.id}
                className={cn(
                  "text-sm font-medium",
                  hasError && "text-red-600 dark:text-red-400",
                  isValid && "text-green-600 dark:text-green-400"
                )}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              <div className="relative">
                {field.type === 'select' && field.options ? (
                  <Select
                    value={fieldValue}
                    onValueChange={(value) => handleFieldChange(field.id, value, field)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "pr-10",
                        hasError && "border-red-500 focus:border-red-500",
                        isValid && "border-green-500 focus:border-green-500"
                      )}
                    >
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.id}
                    type={field.type}
                    value={fieldValue}
                    placeholder={field.placeholder}
                    onChange={(e) => handleFieldChange(field.id, e.target.value, field)}
                    onBlur={() => handleFieldBlur(field.id, field)}
                    className={cn(
                      "pr-10",
                      hasError && "border-red-500 focus:border-red-500",
                      isValid && "border-green-500 focus:border-green-500"
                    )}
                    disabled={field.readonly}
                  />
                )}

                {/* Field status icon */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {renderFieldIcon(field.id)}
                </div>
              </div>

              {/* Error message */}
              {hasError && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors[field.id]}
                </p>
              )}

              {/* Success message */}
              {isValid && !hasError && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Looks good!
                </p>
              )}
            </div>
          );
        })}

        {/* Form validation summary */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Validation:</span> Real-time validation with instant feedback
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
