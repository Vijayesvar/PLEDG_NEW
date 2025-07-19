"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bitcoin } from "lucide-react";
import { TransactionsToggle } from "@/components/ui/transactions-toggle";
import { StatCard } from "@/components/ui/stat-card";

const statusOptions = [
  { value: "all", label: "All Status"},
  { value: "Active", label: "Active"},
  { value: "Completed", label: "Completed"},
];

interface BorrowerItem {
    collateralIcon: React.ReactNode;
    collateralValue: string;
    collateralName: string;
    collateral: string;
    marketPrice: string;
    ltv: string;
    loanAmount: string;
    interestRate: string;
    duration: string;
    recurringAmount: string;
    loss: string;
    csr: string;
    durationLeft: string;
    status: string;
}

interface LenderItem {
    collateralIcon: React.ReactNode;
    collateralValue: string;
    collateralName: string;
    csr: string;
    asset: string;
    amountPaid: string;
    interestRate: string;
    loanAmount: string;
    ltv: string;
    durationLeft: string;
    status: string;
    earnings: string;
}

function getRandomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min: number, max: number, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Helper to format numbers as integer with commas
function formatInt(num: number) {
    return Math.round(num).toLocaleString();
}

const collateralTypes = [
    { type: "BTC", icon: <Bitcoin className="text-orange-400" size={24} />, pricePerUnit: 1000000 },
    { type: "ETH", icon: <Image src="/eth-logo.svg" alt="Ethereum Logo" width={18} height={18} />, pricePerUnit: 300000 },
];
const statusList = ["Active", "Completed"];

const borrowerData: BorrowerItem[] = Array.from({ length: 5 }, () => {
    const collateral = getRandomFromArray(collateralTypes);
    const collateralAmount = getRandomFloat(0.01, 0.2, 3);
    const marketPrice = formatInt(collateralAmount * collateral.pricePerUnit);
    const ltv = getRandomInt(40, 60); // LTV <= 60%
    const loanAmount = formatInt(getRandomFloat(ltv / 100 * collateralAmount * collateral.pricePerUnit * 0.95, ltv / 100 * collateralAmount * collateral.pricePerUnit, 2));
    const interestRate = getRandomFloat(8, 15, 2) + "%";
    const duration = getRandomInt(1, 12) + " Months";
    const loanAmountNum = Number(loanAmount.replace(/,/g, ''));
    const recurringAmount = formatInt(getRandomFloat(loanAmountNum / getRandomInt(3, 12), loanAmountNum / getRandomInt(3, 12), 2)) + "/month";
    const loss = getRandomFloat(0, 2, 2) + "%";
    const csr = getRandomInt(80, 100) + "%";
    const durationLeft = getRandomInt(1, 30) + (getRandomInt(0, 1) ? " Days" : " Months");
    const status = getRandomFromArray(statusList);
    return {
        collateralIcon: collateral.icon,
        collateralValue: collateralAmount + " " + collateral.type,
        collateralName: collateral.type === "BTC" ? "Bitcoin" : "Ethereum",
        collateral: collateralAmount + " " + collateral.type,
        marketPrice,
        ltv: ltv + "%",
        loanAmount,
        interestRate,
        duration,
        recurringAmount,
        loss,
        csr,
        durationLeft,
        status,
    };
});

const lenderData: LenderItem[] = Array.from({ length: 5 }, () => {
    const collateral = getRandomFromArray(collateralTypes);
    const collateralAmount = getRandomFloat(0.01, 0.2, 3);
    const ltv = getRandomInt(40, 60); // LTV <= 60%
    const loanAmount = formatInt(getRandomFloat(ltv / 100 * collateralAmount * collateral.pricePerUnit * 0.95, ltv / 100 * collateralAmount * collateral.pricePerUnit, 2));
    const interestRate = getRandomFloat(8, 15, 2) + "%";
    const durationLeft = getRandomInt(1, 12) + " Months";
    const status = getRandomFromArray(statusList);
    return {
        collateralIcon: collateral.icon,
        collateralValue: collateralAmount + " " + collateral.type,
        collateralName: collateral.type === "BTC" ? "Bitcoin" : "Ethereum",
        csr: getRandomInt(80, 100) + "%",
        asset: collateral.type,
        amountPaid: formatInt(getRandomFloat(1000, 10000, 2)),
        interestRate,
        loanAmount,
        ltv: ltv + "%",
        durationLeft,
        status,
        earnings: formatInt(getRandomFloat(1000, 20000, 2)),
    };
});

const borrowerStats = [
  { title: "Total Borrowed", mainValue: "₹ 2,41,305.52", subValue1: "₹ 1,41,305.52", subLabel1: "This month", subValue2: "₹ 2,41,305.52", subLabel2: "This year" },
  { title: "Interest Paid", mainValue: "₹ 12,305.17", subValue1: "₹ 13,305.52", subLabel1: "This month", subValue2: "₹ 41,305.52", subLabel2: "This year" },
  { title: "Total Loans", mainValue: 5, subValue1: "1", subLabel1: "This month", subValue2: "4", subLabel2: "This year" },
  { title: "My Collateral", mainValue: "", collaterals: [{ icon: <Bitcoin className="text-orange-400" size={24} />, amount: "0.02 BTC", name: "Bitcoin" }] },
];

const lenderStats = [
  { title: "Total Investment", mainValue: "₹ 2,41,305.52", subValue1: "₹ 1,41,305.52", subLabel1: "This month", subValue2: "₹ 2,41,305.52", subLabel2: "This year" },
  { title: "My Profits", mainValue: "₹ 41,305.52", isProfit: true, subValue1: "₹ 13,305.52", subLabel1: "This month", subValue2: "₹ 41,305.52", subLabel2: "This year" },
  { title: "Total Loans", mainValue: 5, subValue1: "1", subLabel1: "This month", subValue2: "4", subLabel2: "This year" },
  { title: "Total Collateral", mainValue: "", collaterals: [
    { icon: <Bitcoin className="text-orange-400" size={24} />, amount: "0.05 BTC", name: "Bitcoin" },
    { icon: <Image src="/eth-logo.svg" alt="Ethereum Logo" width={18} height={18} />, amount: "0.08 ETH", name: "Ethereum" }
  ]},
];

const StatusCell = ({ status }: { status: string }) => {
    const statusColor = {
        Active: "text-[var(--profit)]",
        Completed: "text-foreground",
        Pending: "text-[var(--loss)]",
    }[status];

    return <span className={statusColor}>{status}</span>;
};

const borrowerColumns = [
    { header: "Loan Id", cell: (_: BorrowerItem, idx: number) => <span>{"LN-" + (1000 + idx)}</span> },
    { header: "Loan Amount", cell: (item: BorrowerItem) => <span>₹ {item.loanAmount}</span> },
    { header: "Collateral", cell: (item: BorrowerItem) => (
        <div className="flex w-full items-center justify-center">
            <div className="flex w-[30%] items-center justify-center w-7 h-7 mr-2">
                {item.collateralIcon}
            </div>
            <div className="flex flex-col w-[70%] items-center justify-center">
                {item.collateralValue}
                <div className="text-sm text-[var(--subtext)]">{item.collateralName}</div>
            </div>
        </div>
    ) },
    { header: "LTV", cell: (item: BorrowerItem) => <span className="text-[var(--profit)]">{item.ltv}</span> },
    { header: "Duration Left", cell: (item: BorrowerItem) => item.status === "Completed"
        ? <span className="flex justify-center text-subtext opacity-70 w-full">-</span>
        : <span>{item.durationLeft}</span> },
    { header: "Interest Rate", cell: (item: BorrowerItem) => <span>{item.interestRate}</span> },
    { header: "Monthly Amount", cell: (item: BorrowerItem) => <span>₹ {item.recurringAmount}</span> },
    { header: "Status", cell: (item: BorrowerItem) => <StatusCell status={item.status} /> },
    { header: "", cell: (item: BorrowerItem) => (
        item.status === "Active" ? (
            <button className="cursor-pointer bg-[var(--button)] border border-primary text-white px-4 py-2 rounded-md text-xs hover:bg-primary transition-colors duration-150">
                Pay Installment
            </button>
        ) : null
    ) },
] as const;

const lenderColumns = [
    { header: "Loan Id", cell: (_: LenderItem, idx: number) => <span>{"LN-" + (1000 + idx)}</span> },
    { header: "Loan Amount", cell: (item: LenderItem) => <span>₹ {item.loanAmount}</span> },
    { header: "Collateral", cell: (item: LenderItem) => (
        <div className="flex w-full items-center justify-center">
            <div className="flex w-[30%] items-center justify-center w-7 h-7 mr-2">
                {item.collateralIcon}
            </div>
            <div className="flex flex-col w-[70%] items-center justify-center">
                {item.collateralValue}
                <div className="text-sm text-[var(--subtext)]">{item.collateralName}</div>
            </div>
        </div>
    ) },
    { header: "LTV", cell: (item: LenderItem) => <span className="text-[var(--profit)]">{item.ltv}</span> },
    { header: "Duration Left", cell: (item: LenderItem) => item.status === "Completed"
        ? <span className="flex justify-center text-subtext opacity-70 w-full">-</span>
        : <span>{item.durationLeft}</span> },
    { header: "Interest Rate", cell: (item: LenderItem) => <span>{item.interestRate}</span> },
    { header: "Status", cell: (item: LenderItem) => <StatusCell status={item.status} /> },
] as const;

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("Borrower");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showStatusDropdown) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                statusDropdownRef.current &&
                !statusDropdownRef.current.contains(event.target as Node)
            ) {
                setShowStatusDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showStatusDropdown]);

    const isBorrower = activeTab === "Borrower";
    const data = isBorrower ? borrowerData : lenderData;
    const columns = isBorrower ? borrowerColumns : lenderColumns;
    const stats = isBorrower ? borrowerStats : lenderStats;

    const filteredData = useMemo(() => {
        // Only Active and Completed
        const filtered = data.filter((item) => {
            const statusMatch = (selectedStatus === "all" || item.status === selectedStatus);
            return (item.status === "Active" || item.status === "Completed") && statusMatch;
        });
        // Completed at bottom
        return [
            ...filtered.filter(item => item.status === "Active"),
            ...filtered.filter(item => item.status === "Completed"),
        ];
    }, [data, selectedStatus]);

    const selectedStatusOption = statusOptions.find(option => option.value === selectedStatus);

    return (
        <div className="min-h-screen max-w-7xl mx-auto flex flex-col px-4 md:px-6 lg:px-8 pt-8 pb-12 gap-6">
            <div className="flex flex-row h-full items-center justify-between gap-6">
                <h3 className="text-3xl font-medium">Dashboard</h3>
                <TransactionsToggle active={activeTab} setActive={setActiveTab} />
            </div>
            <div className="bg-secondary flex justify-between w-full rounded-sm text-foreground p-6 gap-4">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
            <div className="bg-secondary w-full rounded-sm text-foreground p-4 px-6">
                <h1 className="text-xl font-medium mb-2">Transactions</h1>        
                <div className="flex flex-col  text-sm flex justify-between mb-6 space-x-4">
                    <div className="w-full h-[1px] bg-header mb-3"></div>
                    <div className="text-sm flex items-center justify-between space-x-4 px-2">
                        <div className="flex items-center space-x-4">
                            <span className="text-subtext text-sm">FILTERS:</span>
                            <div className="relative" ref={statusDropdownRef}>
                                <button 
                                    className="bg-opacity/50 text-[12px] cursor-pointer border border-[var(--field)] text-foreground/50 rounded-sm px-4 py-2 flex items-center focus:outline-none"
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{selectedStatusOption?.label}</span>
                                    </div>
                                    <ChevronDown size={16} className="ml-2 text-foreground/50" />
                                </button>
                                
                                {showStatusDropdown && (
                                    <div className="absolute z-50 px-1 w-full mt-1 bg-secondary border border-header rounded-md shadow-lg max-h-60 overflow-auto">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStatus(option.value);
                                                    setShowStatusDropdown(false);
                                                }}
                                                className="w-full px-3 py-2 text-[12px] text-left hover:bg-header/50 focus:outline-none focus:bg-header/50 flex items-center gap-2 transition-colors duration-150"
                                            >
                                                <span className="text-foreground/50 text-nowrap h-4">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-[1px] bg-header mt-3"></div>
                </div>
                
                <div className="mb-4 text-sm text-subtext">
                    Showing {filteredData.length} of {data.length} results
                </div>
                
                <div className="rounded-sm border border-[var(--field)]/60">
                    <Table>
                        <TableHeader>
                            <TableRow noHover>
                                {columns.map((col) => <TableHead key={col.header}>{col.header}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <TableRow key={index} status={item.status}>
                                        {columns.map((col, colIndex) => (
                                            <TableCell key={colIndex}>
                                                {isBorrower 
                                                    ? (col as { cell: (item: BorrowerItem, idx: number) => React.ReactNode }).cell(item as BorrowerItem, index)
                                                    : (col as { cell: (item: LenderItem, idx: number) => React.ReactNode }).cell(item as LenderItem, index)
                                                }
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center py-8 text-subtext">
                                        No results found. Try adjusting your filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}