"use client";

import { useEffect, useRef, useState } from "react";

import { Option } from "@/types/loan";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function MarketplaceDropdown({ options, value, onChange, placeholder }: {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownAnimation, setDropdownAnimation] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (isOpen) {
        setShowDropdown(true);
        setTimeout(() => setDropdownAnimation('dropdown-animate-in'), 10);
      } else if (showDropdown) {
        setDropdownAnimation('dropdown-animate-out');
        setTimeout(() => {
          setShowDropdown(false);
          setDropdownAnimation('');
        }, 180);
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
  
    const selectedOption = options.find(option => option.value === value);
  
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-[12px] text-foreground/50 text-[var(--subtext)] bg-opacity/15 border border-[var(--field)] rounded-sm px-2 items-center justify-between py-2 focus:outline-none flex gap-2 min-w-[9rem]"
        >
          <div className="flex items-center gap-2">
            <div className="">
              {selectedOption?.icon}
            </div>
            <span className={selectedOption ? "text-foreground/70" : "text-subtext/70"}>
              {selectedOption ? selectedOption.label : placeholder}
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
              "flex flex-col absolute space-y-1 z-50 p-1 w-full mt-1 bg-secondary border border-header/50 rounded-lg shadow-lg max-h-60 overflow-auto",
              dropdownAnimation
            )}
            style={{
              transition: 'opacity 0.18s cubic-bezier(0.4,0,0.2,1), transform 0.18s cubic-bezier(0.4,0,0.2,1)',
              opacity: dropdownAnimation === 'dropdown-animate-in' ? 1 : 0,
              transform: dropdownAnimation === 'dropdown-animate-in' ? 'translateY(0)' : 'translateY(-8px)',
            }}
          >
            {options.map((option: Option, index: number) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="rounded-lg py-1 px-1 text-[12px] text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center gap-2 transition-colors duration-150"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="w-6 h-6 flex items-center justify-center ">
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