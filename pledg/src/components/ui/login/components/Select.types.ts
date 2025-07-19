export interface SelectProps {
  label: string;
  required?: boolean;
  options: string[];
  value: string;
  onChange: (value: string) => void;
} 