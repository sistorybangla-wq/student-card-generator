"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StudentData, CardTemplate, FormField, FormFieldType } from "@/types/card";
import { validateField } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface StudentFormProps {
  studentData: StudentData;
  setStudentData: (data: StudentData | ((prev: StudentData) => StudentData)) => void;
  cardTemplate: CardTemplate;
}

export const StudentForm = ({ studentData, setStudentData, cardTemplate }: StudentFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const previousStudentDataRef = useRef<StudentData>(studentData);

  // Set default values when component mounts or template changes
  useEffect(() => {
    setStudentData(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      cardTemplate.formFields.forEach(field => {
        if (field.defaultValue && (!updated[field.id] || updated[field.id] === '')) {
          updated[field.id] = field.defaultValue;
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [cardTemplate, setStudentData]);

  // Auto-validate when studentData changes (from AI/Quick Generate)
  useEffect(() => {
    // Check if studentData actually changed
    const previousData = previousStudentDataRef.current;
    const hasDataChanged = JSON.stringify(previousData) !== JSON.stringify(studentData);

    if (!hasDataChanged) return;

    // Update ref with new data
    previousStudentDataRef.current = studentData;

    const newErrors: Record<string, string> = {};
    const newTouchedFields: Record<string, boolean> = {};

    cardTemplate.formFields.forEach(field => {
      const value = (studentData[field.id] as string) || '';
      const previousValue = (previousData[field.id] as string) || '';

      // If field value changed and has value, mark as touched and validate
      if (value !== previousValue && value && value.trim() !== '') {
        newTouchedFields[field.id] = true;
        const error = validateField(field.id, value, field);
        if (error) {
          newErrors[field.id] = error;
        } else {
          // Clear any existing error for this field
          newErrors[field.id] = '';
        }
      }
    });

    // Update states
    if (Object.keys(newTouchedFields).length > 0) {
      setTouchedFields(prev => ({ ...prev, ...newTouchedFields }));
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...newErrors }));
    }
  }, [studentData, cardTemplate]);

  // Handle field change with validation
  const handleFieldChange = (fieldId: string, value: string) => {
    setStudentData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setTouchedFields(prev => ({ ...prev, [fieldId]: true }));

    // Find field definition
    const field = cardTemplate.formFields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(fieldId, value, field);
      setFieldErrors(prev => ({
        ...prev,
        [fieldId]: error || ''
      }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (fieldId: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldId]: true }));
    const field = cardTemplate.formFields.find(f => f.id === fieldId);
    const value = (studentData[fieldId] as string) || '';
    if (field) {
      const error = validateField(fieldId, value, field);
      setFieldErrors(prev => ({
        ...prev,
        [fieldId]: error || ''
      }));
    }
  };

  // Get field status for styling
  const getFieldStatus = (fieldId: string) => {
    const hasError = fieldErrors[fieldId] && touchedFields[fieldId];
    const isValid = !fieldErrors[fieldId] && touchedFields[fieldId] && studentData[fieldId];
    return { hasError, isValid };
  };

  // Validate all form fields (currently unused but kept for future use)
  // const validateForm = (): ValidationResult => {
  //   const errors: Record<string, string> = {};
  //   let isValid = true;

  //   cardTemplate.formFields.forEach(field => {
  //     if (field.id === 'photo') return; // Skip photo validation here

  //     const value = studentData[field.id] || '';
  //     const error = validateField(field, value);

  //     if (error) {
  //       errors[field.id] = error;
  //       isValid = false;
  //     }
  //   });

  //   return { isValid, errors };
  // };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setStudentData(prev => ({
        ...prev,
        photo: result
      }));
      toast.success("Photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setStudentData(prev => ({
      ...prev,
      photo: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Photo removed');
  };

  // Render different input types based on field configuration
  const renderFormField = (field: FormField) => {
    const value = studentData[field.id] || '';
    const { hasError, isValid } = getFieldStatus(field.id);
    const error = fieldErrors[field.id];

    switch (field.type) {
      case FormFieldType.SELECT:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(
              hasError && "text-red-600 dark:text-red-400",
              isValid && "text-green-600 dark:text-green-400"
            )}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Select
                value={value}
                onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
                disabled={field.readonly}
              >
                <SelectTrigger className={cn(
                  field.readonly ? "bg-gray-50 text-gray-500" : "",
                  hasError && "border-red-500 focus:border-red-500",
                  isValid && "border-green-500 focus:border-green-500"
                )}>
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
                {isValid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </div>
            </div>
            {hasError && error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );

      case FormFieldType.FILE:
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>

            {!studentData.photo ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Image
                  src={studentData.photo || ''}
                  alt="Student photo"
                  width={128}
                  height={160}
                  className="w-32 h-40 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={cn(
              hasError && "text-red-600 dark:text-red-400",
              isValid && "text-green-600 dark:text-green-400"
            )}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                onBlur={() => handleFieldBlur(field.id)}
                required={field.required}
                readOnly={field.readonly}
                disabled={field.readonly}
                className={cn(
                  field.readonly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "",
                  hasError && "border-red-500 focus:border-red-500 pr-10",
                  isValid && "border-green-500 focus:border-green-500 pr-10"
                )}
                min={field.validation?.min}
                max={field.validation?.max}
              minLength={field.validation?.minLength}
              maxLength={field.validation?.maxLength}
              pattern={field.validation?.pattern}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
                {isValid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </div>
            </div>
            {hasError && error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {cardTemplate.formFields.map((field) => renderFormField(field))}
    </div>
  );
};
