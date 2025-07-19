import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "bg-[var(--primary)] cursor-pointer text-white px-4 py-2 rounded-md flex items-center justify-center text-sm gap-2 focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}