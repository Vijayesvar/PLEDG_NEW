"use client"
import React, { useState } from "react";

const barData = [
  { height: "45%", to: "80%" },
  { height: "55%", to: "70%" },
  { height: "80%", to: "70%" },
  { height: "70%", to: "40%" },
  { height: "75%", to: "55%" },
  { height: "40%", to: "90%" },
  { height: "90%", to: "45%" },
  { height: "35%", to: "80%" },
];

export function Dashboard() {
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
        className="absolute inset-0 opacity-50 "
        style={{
          backgroundImage:
            "linear-gradient(rgba(49,46,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(49,46,129,0.06) 1px, transparent 1px)",
          backgroundSize: "2rem 2rem",
        }}
      />
      
      <div className="absolute bottom-0 right-4 top-4 w-[60%] flex items-end justify-end gap-2.5">
        {barData.map((bar, index) => (
          <div
            key={index}
            className="w-8 rounded-t-lg shadow-2xl shadow-indigo-400/20 dark:shadow-purple-500/20 transition-all duration-400"
            style={{
              height: hovered ? bar.to : bar.height,
              background:
                "linear-gradient(to right, #c7d2fe, #a5b4fc, #c7d2fe)",
            }}
          />
        ))}
      </div>

      <div className="absolute top-1/2 right-0 w-[65%] border-t-2 border-dotted border-indigo-200/40 dark:border-white/10" />
      <div className="absolute bottom-[-5px] group-hover:bottom-[-2px] transition-all delay-40 duration-300 ease-in-out left-2 flex items-baseline z-[70] space-x-6">
        <h1
          className="text-7xl font-bold tracking-tighter text-primary dark:text-white"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          DASHBOARD
        </h1>
      </div>
    </div>
  );
} 