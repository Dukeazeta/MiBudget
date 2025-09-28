import { z } from 'zod';

// Validation schemas
export const transactionAmountSchema = z
  .string()
  .regex(/^\d*\.?\d{0,2}$/, 'Invalid amount format')
  .refine((val) => parseFloat(val || '0') > 0, 'Amount must be greater than 0')
  .refine((val) => parseFloat(val || '0') < 1000000, 'Amount must be less than 1,000,000');

export const transactionDescriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(100, 'Description must be less than 100 characters')
  .regex(/^[^<>]*$/, 'Description cannot contain HTML tags');

export const currencyCodeSchema = z
  .string()
  .length(3, 'Currency code must be 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency code must be uppercase letters only');

// Utility functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const validateAmount = (amount: string): { isValid: boolean; error?: string; value?: number } => {
  const result = transactionAmountSchema.safeParse(amount);
  if (!result.success) {
    return { isValid: false, error: result.error.issues[0].message };
  }
  return { isValid: true, value: parseFloat(amount) };
};

export const validateDescription = (description: string): { isValid: boolean; error?: string; value?: string } => {
  const sanitized = sanitizeInput(description);
  const result = transactionDescriptionSchema.safeParse(sanitized);
  if (!result.success) {
    return { isValid: false, error: result.error.issues[0].message };
  }
  return { isValid: true, value: sanitized };
};

export const validateCurrencyCode = (code: string): { isValid: boolean; error?: string; value?: string } => {
  const result = currencyCodeSchema.safeParse(code);
  if (!result.success) {
    return { isValid: false, error: result.error.issues[0].message };
  }
  return { isValid: true, value: code };
};

// Form validation helper
export const validateTransactionForm = (data: {
  amount: string;
  description: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
  values?: { amount: number; description: string };
} => {
  const errors: Record<string, string> = {};
  
  const amountValidation = validateAmount(data.amount);
  if (!amountValidation.isValid) {
    errors.amount = amountValidation.error!;
  }
  
  const descriptionValidation = validateDescription(data.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error!;
  }
  
  const isValid = Object.keys(errors).length === 0;
  
  return {
    isValid,
    errors,
    values: isValid
      ? {
          amount: amountValidation.value!,
          description: descriptionValidation.value!,
        }
      : undefined,
  };
};