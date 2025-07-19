import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
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
    const [showPassword, setShowPassword] = useState(false);

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
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            className={cn(
              "w-full rounded-md border bg-secondary p-3 pr-10 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition",
              error ? "border-red-500" : "border-header/60"
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput; 