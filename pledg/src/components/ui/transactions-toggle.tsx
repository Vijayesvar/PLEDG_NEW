"use client";

import { cn } from "@/lib/utils";
import { HandCoins, Banknote } from "lucide-react";

interface TransactionsToggleProps {
  active: string;
  setActive: (active: string) => void;
}

export function TransactionsToggle({
  active,
  setActive,
}: TransactionsToggleProps) {
  return (
    <div>
      <div className="flex items-center p-1 rounded-lg bg-opacity/50 gap-2">
        <button
          onClick={() => setActive("Borrower")}
          className={cn(
            "cursor-pointer flex items-center gap-2 px-5 py-1.5 text-sm rounded-md transition-colors duration-200",
            active === "Borrower"
              ? "bg-primary text-white"
              : "text-gray-400 hover:bg-primary/20"
          )}
        >
          <HandCoins size={16} />
          Borrower
        </button>
        <button
          onClick={() => setActive("Lender")}
          className={cn(
            "cursor-pointer flex items-center gap-2 px-5 py-1.5 text-sm rounded-md transition-colors duration-200",
            active === "Lender"
              ? "bg-primary text-white"
              : "text-gray-400 hover:bg-primary/20"
          )}
        >
          <Banknote size={16} />
          Lender
        </button>
      </div>
    </div>
  );
} 