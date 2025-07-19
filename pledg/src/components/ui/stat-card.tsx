import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  mainValue: string | number;
  subValue1?: string;
  subValue2?: string;
  subLabel1?: string;
  subLabel2?: string;
  isProfit?: boolean;
  collaterals?: { icon: React.ReactNode; amount: string; name: string }[];
}

export function StatCard({
  title,
  mainValue,
  subValue1,
  subValue2,
  subLabel1,
  subLabel2,
  isProfit,
  collaterals,
}: StatCardProps) {
  return (
    <div className="bg-secondary flex-1 w-full rounded-sm border border-field p-4 flex flex-col justify-between h-48">
      <h4 className="text-sm text-gray-400">{title}</h4>
      <div className="flex flex-col mt-4 justify-start h-full">
        {collaterals ? (
          <div className="space-y-4">
            {collaterals.map((c, i) => (
              <div key={i} className="flex items-center">
                {c.icon}
                <div className="ml-2">
                  <div className="text-sm font-semibold text-foreground">{c.amount}</div>
                  <div className="text-xs text-gray-400">{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "text-3xl font-bold text-foreground",
              isProfit ? "text-[var(--profit)]" : "text-white"
            )}
          >
            {typeof mainValue === 'string' && mainValue.startsWith("₹") ? (
                <span className="text-foreground">{mainValue}</span>
            ) : (
              <span className="text-foreground">{mainValue}</span>
            )}
          </div>
        )}
      </div>
      {(subValue1 || subValue2) && (
        <div className="flex justify-between text-xs text-gray-400 mt-4">
          <div>
            <div className="font-semibold text-foreground">{subValue1}</div>
            <div>{subLabel1}</div>
          </div>
          <div>
            <div className="font-semibold text-foreground">{subValue2}</div>
            <div>{subLabel2}</div>
          </div>
        </div>
      )}
    </div>
  );
} 