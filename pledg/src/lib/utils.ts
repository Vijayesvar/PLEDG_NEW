import { MarketplaceItem } from "@/types/loan";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getMarketPrice = (item: MarketplaceItem, cryptoPrices: { bitcoin: number; ethereum: number }): string => {
  if (!cryptoPrices) return item.marketPrice;
  
  const collateralMatch = item.collateral.match(/(\d+\.?\d*)/);
  if (!collateralMatch) return item.marketPrice;
  
  const collateralAmount = parseFloat(collateralMatch[1]);
  const cryptoType = item.collateralType.toLowerCase();
  
  if (cryptoType === 'btc' && cryptoPrices.bitcoin) {
      return formatIndianNumber(Math.round(collateralAmount * cryptoPrices.bitcoin));
  } else if (cryptoType === 'eth' && cryptoPrices.ethereum) {
      return formatIndianNumber(Math.round(collateralAmount * cryptoPrices.ethereum));
  }
  
  return item.marketPrice;
};

export const formatIndianNumber = (num: string | number | undefined | null): string => {
  if (num === undefined || num === null || num === '') {
      return '0';
  }
  
  const numStr = num.toString();
  const [wholePart, decimal] = numStr.split('.');
  
  // Add commas for Indian number system (last 3 digits, then groups of 2)
  const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
};

export function formatInt(num: number) {
  return Math.round(num).toLocaleString();
}

export function handleInputChangeUtil<T>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };
}

export function handleBlurUtil<T extends Record<string, string>>(
  setValidatedFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  formData: () => T
) {
  return (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value.trim().length === 0) {
      setValidatedFields((prev) => {
        const newState = { ...prev };
        delete newState[name];
        return newState;
      });
      return;
    }

    let isValid = false;
    switch (name) {
      case "email":
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case "password":
        isValid = value.length >= 8;
        break;
      case "confirmPassword":
        const password = formData().password;
        isValid = value === password;
        break;
      case "username":
        isValid = value.length >= 2;
        break;
      case "phone":
        isValid = /^[0-9]{10}$/.test(value);
        break;
      default:
        return;
    }

    setValidatedFields((prev) => ({ ...prev, [name]: isValid }));
  };
}
