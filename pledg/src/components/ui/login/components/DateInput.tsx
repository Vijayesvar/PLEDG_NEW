import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
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
  ) => (
    <div className="w-full">
      <label className="flex items-center text-[12px] font-regular text-foreground/80 mb-2">
        {label}
        {required && <span className="ml-1 text-[12px] text-red-500/90">*</span>}
      </label>
      <input
        ref={ref}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        className={cn(
          "w-full rounded-md border bg-secondary p-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition",
          error ? "border-red-500" : "border-header/60"
        )}
        {...props}
      />
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
);

DateInput.displayName = "DateInput";

export default DateInput; 