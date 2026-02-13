import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  match?: string;
  custom?: (value: string) => string | null;
}

interface FieldConfig {
  [key: string]: ValidationRules;
}

interface FormErrors {
  [key: string]: string;
}

interface FormValues {
  [key: string]: string;
}

interface UseFormValidationReturn {
  values: FormValues;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  validateField: (name: string, value: string) => string;
  validateForm: () => boolean;
  setFieldValue: (name: string, value: string) => void;
  resetForm: () => void;
  isValid: boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useFormValidation = (
  initialValues: FormValues,
  validationRules: FieldConfig
): UseFormValidationReturn => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback(
    (name: string, value: string): string => {
      const rules = validationRules[name];
      if (!rules) return '';

      if (rules.required && !value.trim()) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
      }

      if (rules.minLength && value.length < rules.minLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rules.minLength} characters`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be less than ${rules.maxLength} characters`;
      }

      if (rules.email && !emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} format is invalid`;
      }

      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) return customError;
      }

      return '';
    },
    [validationRules]
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

  const setFieldValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName] || '');
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    // Check for password match if confirmPassword exists
    if (validationRules.confirmPassword && values.password !== values.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return isValid;
  }, [validationRules, values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.values(errors).every((error) => !error) &&
    Object.keys(validationRules).every((key) => {
      if (validationRules[key].required) {
        return values[key]?.trim();
      }
      return true;
    });

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    setFieldValue,
    resetForm,
    isValid,
  };
};

export default useFormValidation;
