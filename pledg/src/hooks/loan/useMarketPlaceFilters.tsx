import { useEffect, useMemo, useRef, useState } from "react";
import { MarketplaceItem } from "@/types/loan";
import { formatInt } from "@/lib/utils";

export default function useMarketPlaceFilters(
    marketplaceData: MarketplaceItem[]
) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCollateral, setSelectedCollateral] = useState("all");
    const [showCollateralDropdown, setShowCollateralDropdown] = useState(false);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
    const [showFundModal, setShowFundModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

    // const marketplaceDataDemoData: MarketplaceItem[] = Array(20).fill(null).map((_, index) => {
    //     const isBTC = index % 3 === 0;
    //     const collateralType = isBTC ? "BTC" : "ETH";
    //     const collateralAmount = isBTC
    //         ? (Math.random() * (0.2 - 0.01) + 0.01).toFixed(3)
    //         : (Math.random() * (2 - 0.1) + 0.1).toFixed(3);
    //     const pricePerUnit = isBTC ? 1000000 : 300000;
    //     const marketPrice = formatInt(Number(collateralAmount) * pricePerUnit);
    //     return {
    //         collateral: `${collateralAmount} ${collateralType}`,
    //         marketPrice,
    //         ltv: `${60 - (index % 30)}%`,
    //         loanAmount: formatInt((index + 1) * 10000 + 420.12),
    //         interestRate: `${8 + (index % 12)}%`,
    //         duration: `${3 + (index % 6)} Months`,
    //         recurringAmount: formatInt((index + 1) * 2000 + 799.00) + "/month",
    //         loss: `${((index % 5) * 0.5 + 1.94).toFixed(2)}%`,
    //         collateralType,
    //         priceValue: Number(marketPrice.replace(/,/g, "")),
    //         loanAmountValue: (index + 1) * 10000 + 420.12,
    //     };
    // });

    const handleHeaderSort = (field: string) => {
      if (sortField !== field) {
        setSortField(field);
        setSortOrder('asc');
      } else if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('asc');
      }
    };
  
    const handleFundClick = (item: MarketplaceItem) => {
      setSelectedItem(item);
      setShowFundModal(true);
    };
  
    const closeModal = () => {
      setShowFundModal(false);
      setSelectedItem(null);
    };
  
    const filteredData = useMemo(() => {
      // Safety check: ensure marketplaceData is an array
      if (!Array.isArray(marketplaceData)) {
        return [];
      }
      
      let data = marketplaceData.filter((item) => {
        const search = searchTerm.toLowerCase();
        const recurringRaw = item.monthlyPayment.replace(/[^\d]/g, '');
        const searchRaw = searchTerm.replace(/[^\d]/g, '');
        const searchMatch =
          search === "" ||
          item.collateral.toLowerCase().includes(search) ||
          item.amountInr.includes(searchTerm) ||
          item.interestRate.includes(searchTerm) ||
          item.durationMonths.toString().toLowerCase().includes(search) ||
          item.monthlyPayment.toLowerCase().includes(search) ||
          recurringRaw.includes(searchRaw);
        const collateralMatch = selectedCollateral === "all" || item.collateralType === selectedCollateral;
        return searchMatch && collateralMatch;
      });
      if (sortField && sortOrder) {
        data = [...data].sort((a, b) => {
          let aValue = a[sortField as keyof MarketplaceItem];
          let bValue = b[sortField as keyof MarketplaceItem];
          if (["priceValue", "amountInrValue"].includes(sortField)) {
            aValue = Number(aValue);
            bValue = Number(bValue);
          } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            if (sortField === 'monthlyPayment') {
              aValue = aValue.replace(/[^\d]/g, '');
              bValue = bValue.replace(/[^\d]/g, '');
            } else {
              aValue = aValue.replace(/[%/a-zA-Z ]/g, '');
              bValue = bValue.replace(/[%/a-zA-Z ]/g, '');
            }
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
          }
          if (sortOrder === 'asc') return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          if (sortOrder === 'desc') return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          return 0;
        });
      }
      return data;
    }, [searchTerm, selectedCollateral, sortField, sortOrder, marketplaceData]);
  
    const clearFilters = () => {
      setSearchTerm("");
      setSelectedCollateral("all");
    };
  
    const hasActiveFilters = searchTerm || selectedCollateral !== "all";
  
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setShowCollateralDropdown(false);
        }
      }
      if (showCollateralDropdown) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showCollateralDropdown]);

    return {
        searchTerm,
        setSearchTerm,
        setSelectedCollateral,
        selectedCollateral,
        showCollateralDropdown,
        sortField,
        sortOrder,
        showFundModal,
        selectedItem,
        marketplaceDataLength: Array.isArray(marketplaceData) ? marketplaceData.length : 0,
        filteredData,
        handleHeaderSort,
        handleFundClick,
        closeModal,
        clearFilters,
        hasActiveFilters,
        dropdownRef,
    }
}