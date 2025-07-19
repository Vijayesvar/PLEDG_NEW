import React from "react";
import { TextInputProps } from "./TextInput.types";
import FormLabel from "./FormLabel";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, required, isValid, error, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} required={required} />
      <div className="relative mt-1">
        <input
          ref={ref}
          className={cn(
            "w-full text-sm rounded-md border bg-secondary p-2 pr-9 text-base text-foreground focus:outline-none focus:ring-1 focus:ring-primary",
            error ? "border-red-500" : "border-header"
          )}
          {...props}
        />
        {isValid && (
          <Check className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-profit" />
        )}
      </div>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
);
TextInput.displayName = "TextInput";

export default TextInput; 