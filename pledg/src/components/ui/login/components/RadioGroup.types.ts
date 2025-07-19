export interface RadioGroupProps {
  label: string;
  required?: boolean;
  options: string[];
  selectedOption: string;
  onChange: (value: string) => void;
} 