// src/components/dashboard/form-builder/types.ts
export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'time' | 'image';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // For dropdown, radio, checkbox
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  order: number;
}