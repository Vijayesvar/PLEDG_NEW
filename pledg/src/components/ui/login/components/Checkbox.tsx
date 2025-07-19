import React from "react";
import { CheckboxProps } from "./Checkbox.types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, checkboxSize = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: {
        container: "h-4 w-4",
        icon: "h-3 w-3"
      },
      md: {
        container: "h-4.5 w-4.5",
        icon: "h-4 w-4"
      },
      lg: {
        container: "h-6 w-6",
        icon: "h-5 w-5"
      }
    };

    const currentSize = sizeClasses[checkboxSize];

    return (
      <label className="flex cursor-pointer items-center space-x-2">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          {...props}
        />
        <span
          className={cn(
            `flex items-center justify-center rounded border-2 border-gray-500 bg-transparent transition-colors ${currentSize.container}`,
            checked && "border-foreground bg-foreground text-background"
          )}
        >
          {checked && <Check className={currentSize.icon} />}
        </span>
        <span className="text-sm text-foreground">{label}</span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export default Checkbox; 