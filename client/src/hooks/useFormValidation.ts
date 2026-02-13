import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  match?: string;
  custom?: (value: string, formValues: Record<string, string>) => string | null;
}

interface FieldConfig {
  [key: string]: ValidationRules;
}

interface FormErrors {
  [key: string]: string;
}

export const useFormValidation = (fields: FieldConfig) => {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.keys(fields).forEach((key) => {
      initial[key] = '';
    });
    return initial;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (name: string, value: string): string => {
      const rules = fields[name];
      if (!rules) return '';

      if (rules.required && !value.trim()) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
      }

      if (rules.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }

      if (rules.minLength && value.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `Must be less than ${rules.maxLength} characters`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
      }

      if (rules.match && value !== values[rules.match]) {
        return `Does not match ${rules.match}`;
      }

      if (rules.custom) {
        const customError = rules.custom(value, values);
        if (customError) return customError;
      }

      return '';
    },
    [fields, values]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(fields).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return isValid;
  }, [fields, values, validateField]);

  const reset = useCallback(() => {
    const initial: Record<string, string> = {};
    Object.keys(fields).forEach((key) => {
      initial[key] = '';
    });
    setValues(initial);
    setErrors({});
    setTouched({});
  }, [fields]);

  const setValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValue,
    isValid: Object.keys(errors).every((key) => !errors[key]),
  };
};

export default useFormValidation;
