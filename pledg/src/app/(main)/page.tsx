import { ApplyLoan } from "@/components/ui/apply-loan";
import { Dashboard } from "@/components/ui/dashboard";
import { Marketplace } from "@/components/ui/loan/market-place";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto flex flex-col items-center pt-2 gap-4">
      {/* <div className="w-full h-24 rounded-xl bg-gradient-to-br border-3 border-transparent shadow-[0_0_10px_0_rgba(0,0,0,0.05)] from-background to-[#c7d2fe]/50">
        <div>X</div>
      </div> */}
      <div className="w-full h-full flex flex-row gap-3">
        <Link className="flex-1" href="/apply-loan">
          <ApplyLoan />
        </Link>
        <Link className="flex-1" href="/dashboard">
          <Dashboard />
        </Link>
      </div>
      <div className="w-full h-full flex flex-row gap-3">
        <Marketplace />
      </div>
    </div>
  );
}
