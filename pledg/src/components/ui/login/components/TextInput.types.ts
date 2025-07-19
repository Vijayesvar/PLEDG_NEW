import React from "react";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  isValid?: boolean;
  error?: string;
} 