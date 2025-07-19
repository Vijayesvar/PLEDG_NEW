import { FilterX } from "lucide-react"

import { Search } from "lucide-react"
import { MarketplaceDropdown } from "../ui/loan/market-place-dropdown"
import { Button } from "../ui/button"
import { FilterProps } from "@/types/loan"

export default function Filter({
    searchTerm,
    setSearchTerm,
    dropdownRef,
    selectedCollateral,
    setSelectedCollateral,
    clearFilters,
    hasActiveFilters,
    collateralOptions,
}: FilterProps) {
    return (
        <div className="text-sm flex items-center justify-between space-x-4">
        <div className="flex items-center gap-3">
          <span className="text-subtext font-normal text-[12px]">FILTERS:</span>
          <div className="flex items-center">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search collateral, duration, ltv"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-[12px] text-foreground/50 text-[var(--subtext)] bg-opacity/15 border border-[var(--field)] rounded-sm pl-8 pr-4 py-2 focus:outline-none"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 text-[var(--subtext)]"
                size={14}
              />
            </div>
            <div className="relative">
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <MarketplaceDropdown
              options={collateralOptions}
              value={selectedCollateral}
              onChange={setSelectedCollateral}
              placeholder="Select Collateral"
            />
          </div>
        </div>
        <Button 
          className="text-[12px] px-4 py-2 bg-gradient-to-t from-primary to-primary/88 border border-primary/20 rounded-md"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <FilterX size={16} className="mr-2" />
          Remove Filters
        </Button>
      </div>
    )
}