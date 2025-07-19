"use client";

import { useState, useEffect } from "react";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Bitcoin, AlertTriangle, Calculator, IndianRupee, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ApplyLoanPage() {
  const [formData, setFormData] = useState({
    collateralType: "",
    collateralAmount: "",
    loanAmount: "",
    interestRate: 12,
    loanDuration: "",
    ltv: 75,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);

  const prices = {
    BTC: 10000000,
    ETH: 800000, 
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, interestRate: Number(e.target.value) }));
  };

  const calculateLTV = () => {
    if (!formData.collateralType || !formData.collateralAmount || !formData.loanAmount) return 0;
    
    const collateralValue = parseFloat(formData.collateralAmount) * prices[formData.collateralType as keyof typeof prices];
    const loanValue = parseFloat(formData.loanAmount);
    
    return Math.round((loanValue / collateralValue) * 100);
  };

  const getMaxLoanAmount = () => {
    if (!formData.collateralType || !formData.collateralAmount) return 0;
    
    const collateralValue = parseFloat(formData.collateralAmount) * prices[formData.collateralType as keyof typeof prices];
    const maxLTV = formData.collateralType === "USDT" ? 0.9 : 0.6;
    
    return Math.floor(collateralValue * maxLTV);
  };

  const getCollateralValue = () => {
    if (!formData.collateralType || !formData.collateralAmount) return 0;
    return parseFloat(formData.collateralAmount) * prices[formData.collateralType as keyof typeof prices];
  };

  const collateralOptions = [
    {
      value: "BTC",
      label: "Bitcoin",
      shortLabel: "BTC",
      icon: <Bitcoin className="w-5 h-5 text-orange-500" />,
      description: "Max 60% LTV"
    },
    {
      value: "ETH",
      label: "Ethereum",
      shortLabel: "ETH",
      icon: <Image src="/eth-logo.svg" alt="Ethereum Logo" width={12} height={12} />,
      description: "Max 60% LTV"
    },
  ];

  const durationOptions = [
    { icon: "1", value: "30", label: "30 days", description: "Short term" },
    { icon: "2", value: "60", label: "60 days", description: "Medium term" },
    { icon: "3", value: "90", label: "90 days", description: "Medium term" },
    { icon: "4", value: "120", label: "120 days", description: "Long term" },
    { icon: "6", value: "180", label: "180 days", description: "Long term" }
  ];

  const sliderPercentage = ((formData.interestRate - 5) / (25 - 5)) * 100;
  const currentLTV = calculateLTV();
  const maxLoanAmount = getMaxLoanAmount();
  const collateralValue = getCollateralValue();

  return (
    <div className="min-h-[calc(100vh-8rem)] max-w-[43rem] mx-auto bg-background text-foreground mt-12">
      <div 
        className="w-full h-28 rounded-xl border border-header/50 bg-secondary flex px-4 py-4 justify-start gap-4 shadow-[0_0_10px_0_rgba(0,0,0,0.03)]"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.1s ease-in-out, transform 0.2s ease-in-out'
        }}
      >
        <div className="my-auto relative w-18 h-18 rounded-2xl bg-gradient-to-t from-[#22c55e]/10 to-secondary border border-[#f3f3fa] overflow-hidden">
          <Banknote
            className="absolute w-22 h-22 text-[#22c55e] drop-shadow-lg"
            style={{
              right: '-2.2rem',
              bottom: '-2.2rem',
              rotate: '45deg',
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold">Create Loan Request</div>
          <div className="text-sm text-subtext">Set your terms and post your loan request to the marketplace</div>
          <div className="text-xs text-subtext/50">Design such that it attracts more lenders <span className="text-primary/60 cursor-pointer">ⓘ</span></div>
        </div>
      </div>
      <div 
        className="space-y-6 bg-secondary p-6 mt-4 rounded-xl border border-header/50 shadow-[0_0_10px_0_rgba(0,0,0,0.03)]"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.1s ease-in-out 0.05s, transform 0.1s ease-in-out 0.05s'
        }}
      >
        <form className="space-y-4">
          <FormField
            label="Collateral Type"
            type="select"
            name="collateralType"
            value={formData.collateralType}
            onChange={handleChange}
            placeholder="Select your crypto collateral"
            isModernSelect
            selectOptions={collateralOptions}
            isCollateral
          />
          <FormField
            label={
              <div className="flex items-center justify-between">
                <span>Collateral Amount</span>
                {formData.collateralType && (
                  <span className="text-xs text-subtext">
                    Current price: ₹{prices[formData.collateralType as keyof typeof prices]?.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            }
            type="number"
            name="collateralAmount"
            value={formData.collateralAmount}
            onChange={handleChange}
            placeholder="Enter amount of crypto to lock"
            rightLabel={formData.collateralType ? collateralOptions.find(opt => opt.value === formData.collateralType)?.shortLabel : undefined}
            showExtendedInfo={collateralValue > 0}
            extendedInfo={
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-subtext">Collateral Value</span>
                <div className="flex items-center gap-1 text-sm">
                  <IndianRupee className="w-4 h-4 text-profit" />
                  <span className="font-semibold text-profit">
                    {collateralValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            }
          />

          <FormField
            label={
              <div className="flex items-center justify-between">
                <span>Loan Amount (INR)</span>
                {maxLoanAmount > 0 && (
                  <span className="text-xs text-subtext">
                    Max: ₹{maxLoanAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            }
            type="number"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleChange}
            placeholder="Enter INR amount needed"
            isCurrency
            showExtendedInfo={currentLTV > 0}
            extendedInfo={
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-subtext">Loan-to-Value Ratio</span>
                  <span 
                    className={cn(
                      "text-xs px-2 py-1 rounded-full transition-all duration-200 ease-out",
                      currentLTV > (formData.collateralType === "USDT" ? 90 : 60)
                        ? "bg-red-500/20 text-red-400"
                        : currentLTV > (formData.collateralType === "USDT" ? 80 : 50)
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-profit/12 text-profit"
                    )}
                    style={{
                      animation: 'scaleIn 0.2s ease-out forwards'
                    }}
                  >
                    {currentLTV}% LTV
                  </span>
                </div>
                {currentLTV > (formData.collateralType === "USDT" ? 90 : 60) && (
                  <div 
                    className="flex items-center gap-2 text-red-400 text-xs transition-all duration-200 ease-out"
                    style={{
                      animation: 'slideInLeft 0.2s ease-out forwards'
                    }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    LTV exceeds maximum allowed ratio
                  </div>
                )}
              </div>
            }
          />
          <FormField
            label="Loan Duration"
            type="select"
            name="loanDuration"
            value={formData.loanDuration}
            onChange={handleChange}
            placeholder="Select loan duration"
            isModernSelect
            selectOptions={durationOptions}
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80 mb-2 block">
              Interest Rate: {formData.interestRate}%
            </label>
            <div className="mt-2">
              <input
                type="range"
                min="5"
                max="25"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleSliderChange}
                className="w-full h-1.5 rounded-sm appearance-none cursor-pointer range-lg bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/20 [&::-webkit-slider-thumb]:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.13)] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/20 [&::-moz-range-thumb]:shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.1)]"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #7c3aed ${sliderPercentage}%, var(--header) ${sliderPercentage}%)`,
                }}
              />

              <div className="flex justify-between text-xs text-subtext/70 mt-2">
                <span>5% (Better for funding)</span>
                <span>25% (Higher risk)</span>
              </div>
            </div>
          </div>

          {formData.collateralType && formData.collateralAmount && formData.loanAmount && formData.loanDuration && (
            <div 
              className="p-4 mb-6 bg-gradient-to-t from-primary/10 to-secondary rounded-lg border border-[#f3f3fa] transition-all duration-300 ease-out transform"
              style={{
                animation: 'fadeInSlideUp 0.3s ease-out forwards'
              }}
            >
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Loan Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div 
                  className="transition-all duration-200 ease-out"
                  style={{
                    animation: 'slideInLeft 0.2s ease-out 0.1s forwards'
                  }}
                >
                  <p className="text-subtext">Total Interest</p>
                  <p className="font-semibold text-foreground">
                    ₹{((parseFloat(formData.loanAmount) * formData.interestRate / 100) * (parseInt(formData.loanDuration) / 365)).toLocaleString('en-IN')}
                  </p>
                </div>
                <div 
                  className="transition-all duration-200 ease-out"
                  style={{
                    animation: 'slideInRight 0.2s ease-out 0.15s forwards'
                  }}
                >
                  <p className="text-subtext">Total Repayment</p>
                  <p className="font-semibold text-foreground">
                    ₹{(parseFloat(formData.loanAmount) + ((parseFloat(formData.loanAmount) * formData.interestRate / 100) * (parseInt(formData.loanDuration) / 365))).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="flex-1 w-full py-3 font-semibold bg-gradient-to-t shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)] from-primary to-primary/85 hover:from-primary/90 hover:to-primary/95 border border-primary/20 flex items-center justify-center gap-2"
              disabled={!formData.collateralType || !formData.collateralAmount || !formData.loanAmount || !formData.loanDuration || currentLTV > (formData.collateralType === "USDT" ? 90 : 60)}
            >
              Post Loan Request
            </Button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}