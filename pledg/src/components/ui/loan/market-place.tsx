"use client";

import { Bitcoin, Grid3X3 } from "lucide-react";
import Image from "next/image";
import React from "react"; 
import { MarketplaceFundModal } from "./market-place-fund-modal";
import useMarketPlaceFilters from "@/hooks/loan/useMarketPlaceFilters";
import Filter from "@/components/loan/filter";
import { MarketplaceResult } from "./market-place-result";
import { MarketplaceItem } from "@/types/loan";
import useMarketPlace from "@/hooks/loan/useMarketPlace";
import { useCryptoPrices } from "@/hooks/loan/useCryptoPrices";
import Skeleton from "@/components/ui/Skeleton";

const collateralOptions = [
  { value: "all", label: "All Collaterals", icon: <Grid3X3 className="w-4 h-4 text-gray-400" /> },
  { value: "BTC", label: "Bitcoin", icon: <Bitcoin className="w-4 h-4 text-orange-500" /> },
  { value: "ETH", label: "Ethereum", icon: <Image src="/eth-logo.svg" alt="Ethereum Logo" height={10} width={10} /> },
];

export function Marketplace() {
  const { marketplaceData, isLoading } = useMarketPlace();
  const { getPrice, get24hChange } = useCryptoPrices();

  const { 
    searchTerm,
    selectedCollateral,
    showFundModal,
    selectedItem,
    marketplaceDataLength,
    filteredData,
    handleHeaderSort,
    handleFundClick,
    sortField,
    sortOrder,
    closeModal,
    clearFilters,
    hasActiveFilters,
    dropdownRef,
    setSearchTerm,
    setSelectedCollateral,
  } = useMarketPlaceFilters(marketplaceData);

  // if (isLoading) {
  //   return (
  //     <div className="w-full h-full">
  //       <Skeleton />
  //     </div>
  //   );
  // }

  return (
    <div className="bg-secondary w-full rounded-xl text-foreground p-4 px-6 shadow-[0_0_10px_0_rgba(0,0,0,0.05)]">
      {showFundModal && selectedItem && (
        <MarketplaceFundModal 
          cryptoPrices={{ bitcoin: getPrice('bitcoin'), ethereum: getPrice('ethereum') }}
          open={showFundModal} 
          item={selectedItem} 
          onClose={closeModal} 
        />
      )}

      <h1 className="text-2xl font-medium mb-2">Marketplace</h1>
      
      <div className="sticky top-[41px] z-50 bg-secondary text-sm mb-4">
        <div className="w-full">
          <div className="w-full h-[0.8px] bg-header/40 mb-3"></div>
            <Filter 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              dropdownRef={dropdownRef as React.RefObject<HTMLDivElement>}
              selectedCollateral={selectedCollateral}
              setSelectedCollateral={setSelectedCollateral}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters as boolean}
              collateralOptions={collateralOptions}
            />
          <div className="w-full h-[0.8px] bg-header/40 mt-3"></div>
        </div>
      </div>
      
      <div className="mb-4 text-[12px] text-gray-400">
        Showing {filteredData.length} of {marketplaceDataLength} results
      </div>

      <MarketplaceResult
        loading={isLoading}
        filteredData={filteredData as MarketplaceItem[]}
        handleHeaderSort={handleHeaderSort}
        handleFundClick={handleFundClick}
        sortField={sortField as string}
        sortOrder={sortOrder as string}
        get24hChange={get24hChange}
        cryptoPrices={{ bitcoin: getPrice('bitcoin'), ethereum: getPrice('ethereum') }}
      />
      
    </div>
  );
}