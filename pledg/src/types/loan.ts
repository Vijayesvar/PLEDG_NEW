export interface MarketplaceItem {
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

export interface MarketplaceColumn {
    header: string;
    sortable: boolean;
    cell: (item: MarketplaceItem) => React.ReactNode;
}

export interface FilterProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
    selectedCollateral: string;
    setSelectedCollateral: (value: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    collateralOptions: { value: string; label: string; icon: React.ReactNode }[];
}

export interface Option {
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
  }