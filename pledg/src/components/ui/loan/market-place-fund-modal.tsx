"use client";

import React, { useEffect, useState } from "react";
import { Bitcoin, CaseUpper, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../button";
import { formatIndianNumber, getMarketPrice } from "@/lib/utils";

interface MarketplaceItem {
  collateral: string;
  marketPrice: string;
  ltv: string;
  amountInr: string;
  interestRate: string;
  durationMonths: number;
  monthlyPayment: string;
  loss: string;
  collateralType: string;
  priceValue: number;
  loanAmountValue: number;
}

interface MarketplaceFundModalProps {
  open: boolean;
  item: MarketplaceItem;
  onClose: () => void;
  cryptoPrices: { bitcoin: number; ethereum: number };
}

export const MarketplaceFundModal: React.FC<MarketplaceFundModalProps> = ({ open, item, onClose, cryptoPrices }) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const timeout = setTimeout(() => setAnimateIn(true), 10);
    return () => clearTimeout(timeout);
  }, [open, item]);

  const loanAmount = Number(item.amountInr.replace(/,/g, ''));
  const duration = item.durationMonths;
  const recurringAmount = Number(item.monthlyPayment.replace(/[^\d.]/g, ''));

  return (
    <div
      className={`fixed inset-0 z-92 flex items-center justify-center z-50 transition-opacity duration-300 ${animateIn ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`bg-secondary rounded-2xl px-6 py-4 max-w-md w-full mx-4 relative transition-all duration-300 ease-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Fund Loan</h2>
                <h2 className="text-sm text-subtext">Please review details before funding</h2>
            </div>
          <button
            onClick={onClose}
            className="relative -top-4 cursor-pointer -right-2 p-1 hover:bg-header/20 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 w-full">
          <div className="bg-header/10 w-full rounded-lg">
            <div className="bg-gradient-to-t from-primary/20 to-secondary border border-[#e0d7fa] w-full rounded-lg p-1 px-4 flex justify-between items-center gap-3 mb-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex bg-primary/5 rounded-lg w-8 h-8 items-center justify-center shadow-[inset_0_2px_8px_0_rgba(0,0,0,0.12)]">
                    {item.collateralType === "BTC" ? (
                        <Bitcoin className="w-5 h-5" color="#f7931a" />
                    ) : (
                        <Image src="/eth-logo.svg" alt="Ethereum Logo" width={16} height={16} className="w-5 h-5" />
                    )}
                    </div>
                    <div>
                    <div className="text-sm font-medium">{item.collateral} {(item.collateralType).toUpperCase()}</div>
                    <div className="text-sm text-subtext">
                        {item.collateralType === "BTC" ? "Bitcoin" : "Ethereum"}
                    </div>
                    </div>
                </div>
                <div className="relative -top-2 text-base text-subtext font-bold">
                    ≈
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-sm text-subtext">
                        ₹{getMarketPrice(item, cryptoPrices)} collateral
                    </div>
                    <div className="text-sm font-medium">
                        ₹{formatIndianNumber(loanAmount)} Loan
                    </div>
                </div>
            </div>
            <div className="text-base font-semibold mb-3 mt-6">Loan Detail</div>
            <div className="flex flex-col gap-2 w-full text-sm">
                <div className="flex justify-between">
                    <div className="text-subtext">LTV</div>
                    <div className="font-normal">{item.ltv}%</div>
                </div>
                <div className="flex justify-between">
                    <div className="text-subtext">Interest Rate</div>
                    <div className="font-normal">{item.interestRate}%</div>
                </div>
                <div className="flex justify-between">
                    <div className="text-subtext">Duration</div>
                    <div className="font-normal">{duration} Months</div>
                </div>
                <div className="flex justify-between">
                    <div className="text-subtext">Recurring Amount</div>
                    <div className="font-normal">₹{recurringAmount}/month</div>
                </div>
                <div className="flex justify-between">
                    <div className="text-subtext">Total Profit</div>
                    <div className="font-semibold text-profit">₹{formatIndianNumber(Math.abs(recurringAmount * duration - loanAmount))}</div>
                </div>
            </div>
            <div className="flex justify-between text-sm mb-3 mt-6">
                <div className="text-subtext">Loan Amount</div>
                <div className="font-normal">₹{formatIndianNumber(loanAmount)}</div>
            </div>
            <div className="flex justify-between text-sm">
                <div className="text-subtext">Platform Fee (2%)</div>
                <div className="flex items-center gap-1">
                    <div className="font-semibold text-profit">₹0.00</div>
                    <div className="font-normal line-through text-subtext">₹{formatIndianNumber(loanAmount * 0.02)}</div>
                </div>
            </div>
            <div className="flex flex-col">
                <div className="w-full h-[1px] bg-field my-3"></div>
                <div className="flex font-semibold justify-between text-sm">
                    <div className="">Total</div>
                    <div className="">₹{formatIndianNumber(loanAmount)}</div>
                </div>
                <div className="w-full h-[1px] bg-field my-3"></div>
            </div>
          </div>
          
          <div className="flex pt-1">
            <Button
              className="flex-1 py-3 font-semibold bg-gradient-to-t shadow-[0_0_0_10px_rgba(0,0,0,0.1)] [box-shadow:inset_0_2px_8px_0_rgba(0,0,0,0.06)] from-primary to-primary/88 border border-primary/20 flex items-center justify-center gap-2"
            >
            <Image width={20} height={20} src="/razorpay.png" alt="Razorpay" className="object-contain" />
            <span>Pay using Razorpay</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 