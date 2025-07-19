import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder: string;
  name: string;
  error?: string;
  icon?: React.ReactNode;
  prefix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      name,
      type = "text",
      required = false,
      value,
      onChange,
      onBlur,
      error,
      icon: Icon,
      prefix,
      ...props
    },
    ref
  ) => (
    <div className="w-full">
      <label className="flex items-center text-[12px] font-regular text-foreground/80 mb-2">
        {label}
        {required && <span className="ml-1 text-[12px] text-red-500/90">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {Icon}
          </span>
        )}
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-[12px] font-medium">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border bg-secondary p-3 pr-9 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition",
            (Icon || prefix) ? "pl-10" : "pl-3",
            error ? "border-red-500" : "border-header/60"
          )}
          {...props}
        />
      </div>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
);

Input.displayName = "Input";

export default Input; 