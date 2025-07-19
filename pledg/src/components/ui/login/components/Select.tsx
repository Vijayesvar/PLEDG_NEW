import React, { useState } from "react";
import { SelectProps } from "./Select.types";
import FormLabel from "./FormLabel";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = ({ label, required, options, value, onChange }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, selectRef]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={selectRef}>
      <FormLabel label={label} required={required} />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 flex w-full items-center justify-between rounded-md border border-header bg-secondary p-2 text-left text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span>{value}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-header bg-secondary py-1 shadow-lg">
          <ul className="max-h-60 overflow-auto">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="cursor-pointer px-3 py-2 text-foreground hover:bg-subtext/10"
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select; 