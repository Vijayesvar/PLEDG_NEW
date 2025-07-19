import { MarketplaceColumn, MarketplaceItem } from "@/types/loan";
import { Bitcoin, IndianRupee, ChevronDown, ChevronUp, Grid3X3, SortAsc, SortDesc } from "lucide-react";
import Image from "next/image";
import React, { ReactNode } from "react";
import { formatIndianNumber, getMarketPrice } from "@/lib/utils";

interface MarketplaceResultProps {
    loading: boolean;
    filteredData: MarketplaceItem[];
    handleHeaderSort: (field: string) => void;
    handleFundClick: (item: MarketplaceItem) => void;
    sortField: string;
    sortOrder: string;
    get24hChange: (crypto: 'bitcoin' | 'ethereum') => number;
    cryptoPrices: { bitcoin: number; ethereum: number };
}

export const MarketplaceResult = ({
    loading,
    filteredData,
    handleHeaderSort,
    handleFundClick,
    sortField,
    sortOrder,
    cryptoPrices,
    get24hChange,
}: MarketplaceResultProps) => {

    const marketplaceColumns: MarketplaceColumn[] = [
        { 
            header: "Collateral",
            sortable: false,
            cell: (item: MarketplaceItem) => (
              <div className="flex w-full items-center justify-center">
                <div className="flex bg-primary/5 rounded-lg w-[30%] items-center justify-center w-8 h-8 mr-2 shadow-[inset_0_2px_8px_0_rgba(0,0,0,0.12)]">
                  {item.collateralType === "BTC" ? (
                    <Bitcoin className="w-5 h-5" color="#f7931a" />
                  ) : 
                    <Image src="/eth-logo.svg" alt="Ethereum Logo" width={16} height={16} className="w-5 h-5" />
                  }
                </div>
                <div className="flex items-start flex-col w-[70%] justify-between">
                  <span className="font-[450]">{item.collateral} {item.collateralType === "BTC" ? "BTC" : "ETH"}</span>
                  <div className="text-sm text-[var(--subtext)]">
                    {item.collateralType === "BTC" ? "Bitcoin" : "Ethereum"}
                  </div>
                </div>
              </div>
            )
        },
        {
            header: "Market Price",
            sortable: true,
            cell: (item: MarketplaceItem) => (
                <div className="flex flex-col items-center">
                    <div className="flex items-center font-[450]">
                        <IndianRupee size={12} className="" />
                        <span>{getMarketPrice(item, cryptoPrices)}</span>
                    </div>
                    {get24hChange(item.collateralType.toLowerCase() === 'btc' ? 'bitcoin' : 'ethereum') < 0 ? (
                        <div className="text-sm text-[var(--loss)] text-[0.8rem]">
                          {`▼ ${get24hChange(item.collateralType.toLowerCase() === 'btc' ? 'bitcoin' : 'ethereum').toFixed(2)}%`}
                        </div>
                    ) : (
                        <div className="text-sm text-[var(--profit)] text-[0.8rem]">
                          {`▲ ${get24hChange(item.collateralType.toLowerCase() === 'btc' ? 'bitcoin' : 'ethereum').toFixed(2)}%`}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Loan Amount",
            sortable: true,
            cell: (item: MarketplaceItem) => (
                <div className="flex items-center justify-center font-[450]">
                    <IndianRupee size={12} className="" />
                    <span>{formatIndianNumber(item.amountInr)}</span>
                </div>
            )
        },
        { header: "LTV", sortable: true, cell: (item: MarketplaceItem) => <span className="font-[450]">{item.ltv}%</span> },
        { header: "Interest Rate", sortable: true, cell: (item: MarketplaceItem) => <span className="font-[450]">{item.interestRate}%</span> },
        { header: "Duration", sortable: true, cell: (item: MarketplaceItem) => <span className="font-[450]">{item.durationMonths} <span>Months</span></span> },
        {
            header: "Recurring Amount",
            sortable: true,
            cell: (item: MarketplaceItem) => (
                <div className="flex items-center justify-center font-[450]">
                    <IndianRupee size={12} className="" />
                    <span>{formatIndianNumber(item.monthlyPayment)}</span><span>/Month</span>
                </div>
            )
        },
        {
            header: "",
            sortable: false,
            cell: (item: MarketplaceItem) => (
                <div className="flex justify-center">
                    <button 
                      className="cursor-pointer font-medium bg-gradient-to-t from-primary to-primary/88 border border-primary/20 text-xs text-white px-3 py-2 rounded-md"
                      onClick={() => handleFundClick(item)}
                    >
                      ₹ Fund
                    </button>
                </div>
            )
        }
      ];

    const headerIcons: Record<string, ReactNode> = {
        "Collateral": <Grid3X3 className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "Market Price": <IndianRupee className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "Loan Amount": <IndianRupee className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "LTV": <SortAsc className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "Interest Rate": <SortDesc className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "Duration": <SortDesc className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "Recurring Amount": <IndianRupee className="inline-block w-4 h-4 mr-1 text-gray-300" />,
        "": <></>,
    };

    return (
        <div className="w-full">
            <div className="flex sticky top-[101px] bg-white z-40 text-center text-gray-500 text-sm font-normal select-none">
            {marketplaceColumns.map((col) => (
                col.sortable === false ? (
                <div
                    key={col.header}
                    className="flex-1 py-2 mb-2 flex items-center justify-center gap-1 text-xs rounded-lg select-none"
                >
                    <span className="flex items-center justify-center gap-1 select-none">
                    {headerIcons[col.header]}
                    <span>{col.header}</span>
                    </span>
                </div>
                ) : (
                <div
                    onClick={() => handleHeaderSort(col.header)}
                    key={col.header}
                    className="flex-1 py-2 mb-2 flex items-center justify-center gap-1 cursor-pointer text-xs transition-colors duration-150 rounded-lg hover:bg-header/20"
                >
                    <span>{col.header}</span>
                    <span className="flex flex-col ml-1">
                    <ChevronUp
                        className={`w-3 h-3 ${sortField === col.header && sortOrder === 'asc' ? 'text-primary' : 'text-gray-400'}`}
                    />
                    <ChevronDown
                        className={`w-3 h-3 -mt-1 ${sortField === col.header && sortOrder === 'desc' ? 'text-primary' : 'text-gray-400'}`}
                    />
                    </span>
                </div>
                )
            ))}
            </div>
        
            <div className="mx-auto w-[95%] h-[1px] bg-field/80 sticky top-[144px] z-40" />
                {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                        <React.Fragment key={index}>
                            <div className={`flex text-center text-[13px] transition-colors duration-150 hover:bg-[#292632]/5 rounded-xl ${index % 2 === 0 ? 'bg-primary/3' : 'bg-transparent'}`}>
                                {marketplaceColumns.map((col, colIndex) => (
                                <div key={colIndex} className={`flex-1 py-3 px-4 flex items-center justify-center text-[13.5px] ${col.header === '' ? 'justify-end' : ''}`}> 
                                    {col.cell(item)}
                                </div>
                                ))}
                            </div>

                            {index < filteredData.length - 1 && (
                                <div className="mx-auto w-[95%] border-b border-field/80 rounded-full" />
                            )}
                        </React.Fragment>
                    ))
                ) : loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <React.Fragment key={index}>
                        <div className={`flex text-center text-[13px] animate-pulse transition-all duration-150 transition-colors duration-150 hover:bg-[#292632]/5 rounded-xl ${index % 2 === 0 ? 'bg-primary/3' : 'bg-transparent'}`}>
                            {marketplaceColumns.map((col, colIndex) => (
                            <div key={colIndex} className={`flex-1 mt-1 h-14 py-3 px-4 flex items-center justify-center font-[400] text-[13.5px] ${col.header === '' ? 'justify-end' : ''}`}> 
                            </div>
                            ))}
                        </div>
                        {index < (4-1) && (
                            <div className="mx-auto w-[95%] border-b border-field/80 rounded-full" />
                        )}
                        </React.Fragment>
                    ))
                ) : (
                    <div className="py-8 text-center text-subtext text-[13px]">No loans found.</div>
                )}
            </div>
    )
}