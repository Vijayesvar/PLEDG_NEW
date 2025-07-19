import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  checkboxSize?: "sm" | "md" | "lg";
} 