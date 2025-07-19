import { cn } from "@/lib/utils";
import { ChevronDown, Grid3X3, IndianRupee } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface FormFieldProps {
  label: string | React.ReactNode;
  type: "select" | "text" | "number" | "slider";
  placeholder?: string;
  options?: string[];
  name: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className?: string;
  children?: React.ReactNode;
  isCurrency?: boolean;
  isModernSelect?: boolean;
  isCollateral?: boolean;
  rightLabel?: string;
  showExtendedInfo?: boolean;
  extendedInfo?: React.ReactNode;
  selectOptions?: Array<{
    value: string;
    label: string;
    shortLabel?: string;
    icon?: React.ReactNode;
    description?: string;
  }>;
}

export function FormField({
  label,
  type,
  placeholder,
  options,
  name,
  value,
  onChange,
  className,
  children,
  isCurrency,
  isModernSelect,
  isCollateral,
  rightLabel,
  showExtendedInfo,
  extendedInfo,
  selectOptions,
}: FormFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // NEW: controls mounting for exit animation
  const [dropdownAnimation, setDropdownAnimation] = useState(''); // NEW: controls animation class
  const [showExtended, setShowExtended] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShowDropdown(true);
      // Animate in
      setTimeout(() => setDropdownAnimation('dropdown-animate-in'), 10);
    } else if (showDropdown) {
      // Animate out
      setDropdownAnimation('dropdown-animate-out');
      setTimeout(() => {
        setShowDropdown(false);
        setDropdownAnimation('');
      }, 180); // match animation duration
    }
  }, [isOpen, showDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showExtendedInfo) {
      setShowExtended(true);
    } else {
      setShowExtended(false);
    }
  }, [showExtendedInfo]);

  const getSelectedOption = () => {
    if (isModernSelect && selectOptions) {
      return selectOptions.find(option => option.value === value);
    }
    return null;
  };

  const handleModernSelectChange = (optionValue: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: optionValue }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  const renderInput = () => {
    switch (type) {
      case "select":
        if (isModernSelect && selectOptions) {
          const selectedOption = getSelectedOption();
          return (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-secondary shadow-[0_0_10px_0_rgba(0,0,0,0.1)] rounded-md pl-3 pr-4 py-2.5 text-sm text-left focus:outline-none focus:border-primary flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {isCollateral && (
                    selectedOption?.icon ?
                    <div className="bg-gradient-to-t from-primary/20 to-secondary border border-[#e0d7fa] rounded-lg p-1 w-8 h-8 flex items-center justify-center">
                      {selectedOption?.icon}
                    </div>
                    :
                    <div className="bg-gradient-to-t from-primary/20 to-secondary border border-[#e0d7fa] rounded-lg p-1 w-8 h-8 flex items-center justify-center">
                      <Grid3X3 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className={selectedOption ? "text-foreground" : "text-subtext/70"}>
                    {selectedOption ? 
                      <div className="flex flex-col items-start gap-0.4">
                        <span>{selectedOption.label}</span>
                        {selectedOption.shortLabel && (
                          <span className="text-[10px] text-subtext">{selectedOption.shortLabel}</span>
                        )}
                      </div> : 
                    placeholder}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-subtext transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {showDropdown && (
                <div
                  className={cn(
                    "flex flex-col absolute space-y-1 z-50 p-2 w-full mt-1 bg-secondary border border-header/50 rounded-lg shadow-lg max-h-60 overflow-auto",
                    dropdownAnimation
                  )}
                  style={{
                    transition: 'opacity 0.18s cubic-bezier(0.4,0,0.2,1), transform 0.18s cubic-bezier(0.4,0,0.2,1)',
                    opacity: dropdownAnimation === 'dropdown-animate-in' ? 1 : 0,
                    transform: dropdownAnimation === 'dropdown-animate-in' ? 'translateY(0)' : 'translateY(-8px)',
                  }}
                >
                  {selectOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleModernSelectChange(option.value)}
                      className="rounded-lg py-1 px-1 text-sm text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center gap-2 transition-colors duration-150"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-t from-black/2 to-black/5 border border-gray-200/50">
                        {option.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground">{option.label}</span>
                        {option.description && (
                          <span className="text-[10px] text-subtext">{option.description}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div className="relative">
            <select
              name={name}
              value={value}
              onChange={onChange}
              className={cn(
                "w-full bg-secondary border border-header rounded-md pl-3 pr-10 py-2.5 text-sm appearance-none focus:outline-none",
                !value && "text-subtext/70"
              )}
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext"
            />
          </div>
        );
      case "text":
      case "number":
        return (
          <div className={cn(
            "relative bg-secondary shadow-[0_0_10px_0_rgba(0,0,0,0.1)] rounded-md transition-all duration-150 ease-out",
            showExtended && "rounded-b-none"
          )}>
            {isCurrency && (
              <IndianRupee
                size={14}
                className="absolute left-3 top-[13px] text-subtext z-10"
              />
            )}
            <input
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className={cn(
                "w-full bg-transparent py-2.5 text-sm focus:outline-none focus:border-primary placeholder:text-subtext/70 placeholder:text-sm border-0",
                isCurrency ? "pl-9 pr-3" : rightLabel ? "px-3 pr-12" : "px-3"
              )}
            />
            {rightLabel && (
              <div className="absolute right-3 top-2.5 text-sm font-medium text-foreground/70 z-10">
                {rightLabel}
              </div>
            )}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              showExtended ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="flex justify-center py-2">
                <div className="w-[95%] h-[0.5px] bg-header/40"></div>
              </div>
              <div className="px-3 pb-2">
                {extendedInfo}
              </div>
            </div>
          </div>
        );
      case "slider":
        return <div className="mt-2">{children}</div>;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="text-sm font-semibold text-foreground/80 mb-2 block">
        {label}
      </label>
      {renderInput()}
    </div>
  );
} 