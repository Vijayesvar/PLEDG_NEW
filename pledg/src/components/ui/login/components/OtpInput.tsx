import { forwardRef, InputHTMLAttributes, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  length?: number;
  error?: string;
  onOtpChange?: (otp: string) => void;
  onResend?: () => void;
  resendDisabled?: boolean;
  resendCountdown?: number;
}

const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  (
    {
      label,
      length = 6,
      required = false,
      error,
      onOtpChange,
      onResend,
      resendDisabled = false,
      resendCountdown = 0,
      ...props
    },
  ) => {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const focusInput = (index: number) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]?.focus();
      }
    };

    const handleChange = (index: number, value: string) => {
      if (value.length > 1) {
        value = value.slice(-1); // Take only the last character
      }

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value is entered
      if (value && index < length - 1) {
        focusInput(index + 1);
      }

      // Call parent callback with complete OTP
      const completeOtp = newOtp.join("");
      onOtpChange?.(completeOtp);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        focusInput(index - 1);
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
      const pastedArray = pastedData.slice(0, length).split("");
      
      const newOtp = [...otp];
      pastedArray.forEach((char, index) => {
        if (index < length) {
          newOtp[index] = char;
        }
      });
      
      setOtp(newOtp);
      onOtpChange?.(newOtp.join(""));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(char => !char);
      focusInput(nextEmptyIndex >= 0 ? nextEmptyIndex : length - 1);
    };

    return (
      <div className="w-full">
        <label className="flex items-center text-[12px] font-regular text-foreground/80 mb-2">
          {label}
          {required && <span className="ml-1 text-[12px] text-red-500/90">*</span>}
        </label>
        
        <div className="flex gap-2 justify-center mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={cn(
                "w-12 h-12 text-center text-lg font-semibold rounded-md border bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all",
                error ? "border-red-500" : "border-header/60",
                digit && "border-primary bg-primary/10"
              )}
              {...props}
            />
          ))}
        </div>

        {error && <div className="text-xs text-red-500 mt-1 text-center">{error}</div>}
        
        {onResend && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onResend}
              disabled={resendDisabled}
              className={cn(
                "text-xs text-primary hover:underline transition-colors",
                resendDisabled && "text-gray-400 cursor-not-allowed"
              )}
            >
              {resendDisabled 
                ? `Resend OTP in ${resendCountdown}s` 
                : "Resend OTP"
              }
            </button>
          </div>
        )}
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";

export default OtpInput; 