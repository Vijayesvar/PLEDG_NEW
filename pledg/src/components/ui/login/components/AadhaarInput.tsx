import { forwardRef, InputHTMLAttributes, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface AadhaarInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

const AadhaarInput = forwardRef<HTMLInputElement, AadhaarInputProps>(
  (
    {
      label,
      name,
      required = false,
      value,
      onChange,
      onBlur,
      error,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState("");

    // Synchronize displayValue with value prop
    useEffect(() => {
      if (value) {
        const formatted = formatAadhaar(value.toString());
        setDisplayValue(formatted);
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const formatAadhaar = (value: string) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, "");
      
      // Limit to 12 digits
      const limited = digits.slice(0, 12);
      
      // Format as XXXX-XXXX-XXXX
      if (limited.length <= 4) {
        return limited;
      } else if (limited.length <= 8) {
        return `${limited.slice(0, 4)}-${limited.slice(4)}`;
      } else {
        return `${limited.slice(0, 4)}-${limited.slice(4, 8)}-${limited.slice(8)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatAadhaar(e.target.value);
      setDisplayValue(formatted);
      
      // Pass the raw digits to the parent component
      const rawValue = e.target.value.replace(/\D/g, "").slice(0, 12);
      
      // Create a synthetic event with the raw value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: rawValue
        }
      };
      
      onChange?.(syntheticEvent);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure the raw value is passed to the parent's onBlur handler
      const rawValue = e.target.value.replace(/\D/g, "").slice(0, 12);
      
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: rawValue
        }
      };
      
      onBlur?.(syntheticEvent);
    };

    return (
      <div className="w-full">
        <label className="flex items-center text-[12px] font-regular text-foreground/80 mb-2">
          {label}
          {required && <span className="ml-1 text-[12px] text-red-500/90">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            name={name}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            required={required}
            maxLength={14} // XXXX-XXXX-XXXX format
            placeholder="1234-5678-9012"
            className={cn(
              "w-full rounded-md border bg-secondary p-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition tracking-wider",
              error ? "border-red-500" : "border-header/60"
            )}
            {...props}
          />
          {!error && displayValue.length === 14 && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Check className="w-3 h-3 text-green-600"></Check>
            </div>
          )}
        </div>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
    );
  }
);

AadhaarInput.displayName = "AadhaarInput";

export default AadhaarInput; 