"use client"
import { IndianRupee, DollarSign, Bitcoin } from "lucide-react";
import { useState } from "react";

export function ApplyLoan() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group cursor-pointer relative w-full h-60 rounded-xl 
      box-border border-3 border-transparent
      hover:border-primary/5
      transition-all duration-80 overflow-hidden
      bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe] text-[#312e81]
      dark:from-[#4E3DAC] dark:to-[#201946] dark:border-[#4E3DAC] dark:text-white
    "
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 z-60 transition-opacity duration-300" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(49,46,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(49,46,129,0.06) 1px, transparent 1px)",
          backgroundSize: "2rem 2rem",
        }}
      />
      
      <DollarSign
        className={`absolute -bottom-8 -left-5 text-[#6366f1] dark:text-[#3E318A] opacity-10 transition-transform duration-300 ${hovered ? 'translate-x-1 -translate-y-1' : ''}`}
        size={120}
        strokeWidth={1.5}
        style={{ transform: "rotate(-25deg)" }}
      />
      <DollarSign
        className={`absolute top-16 left-44 text-[#818cf8] dark:text-[#4D3CAF] opacity-20 transition-transform duration-300 ${hovered ? '-translate-x-1 translate-y-1' : ''}`}
        size={24}
        strokeWidth={1.5}
        style={{ transform: "rotate(-25deg)" }}
      />
      <IndianRupee
        className={`absolute top-24 left-18 text-[#818cf8] dark:text-[#4D3CAF] opacity-20 transition-transform duration-300 ${hovered ? 'translate-x-1 translate-y-1' : ''}`}
        size={14}
        strokeWidth={1.5}
        style={{ transform: "rotate(-14deg)" }}
      />
      <IndianRupee
        className={`absolute top-2 right-10 text-[#6366f1] dark:text-[#3E318A] opacity-20 transition-transform duration-300 ${hovered ? '-translate-x-1 translate-y-1' : ''}`}
        size={90}
        strokeWidth={1.5}
        style={{ transform: "rotate(20deg)" }}
      />
      <DollarSign
        className={`absolute bottom-4 left-36 text-[#6366f1] dark:text-[#3E318A] opacity-20 transition-transform duration-300 ${hovered ? '-translate-x-1 -translate-y-1' : ''}`}
        size={30}
        strokeWidth={2}
        style={{ transform: "rotate(-30deg)" }}
      />
      <div
        className={`absolute top-1/2 left-[130px] -translate-x-1/2 -translate-y-1/2 drop-shadow-lg transition-transform duration-300 ${hovered ? '-translate-x-1 -translate-y-1' : ''}`}
        style={{
          transform: `${hovered ? 'rotate(20deg)' : 'rotate(15deg)'} scale(0.6)`,
          transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <svg
          width="120"
          height="116"
          viewBox="0 0 100 116"
        >
          <ellipse cx="50" cy="58" rx="48" ry="56" fill="#e0e7ff" />
          <path d="M 50 2 L 50 2" stroke="#a5b4fc" strokeWidth="2" />
          <ellipse cx="44" cy="58" rx="48" ry="56" fill="#c7d2fe" />
          <path d="M 50 114 L 50 114" stroke="#a5b4fc" strokeWidth="2" />
        </svg>
        <Bitcoin
          className={`absolute top-1/2 left-1/2 -translate-x-3/5 -translate-y-2/4 text-[#818cf8] dark:text-[#4E3DAC] -rotate-2 opacity-50 transition-transform duration-300 ${hovered ? '-translate-x-1 -translate-y-1' : ''}`}
          size={70}
          strokeWidth={1.5}
        />
      </div>
      <div className="absolute bottom-[-5px] group-hover:bottom-[-2px] transition-all duration-300 ease-in-out left-2 flex items-baseline z-[70] space-x-6">
        <h1
          className="text-7xl font-bold tracking-tighter text-primary dark:text-white"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          APPLY
        </h1>
        <h1
          className="text-7xl font-bold tracking-tighter text-primary dark:text-white"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          LOAN
        </h1>
      </div>
    </div>
  );
}