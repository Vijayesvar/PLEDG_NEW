import { MarketplaceItem } from "@/types/loan";
import { getMarketplaceData } from "@/api/loan";
import { useEffect, useState } from "react";


export default function useMarketPlace() {
    const [marketplaceData, setMarketplaceData] = useState<MarketplaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        (
            async () => {
                try {
                    setIsLoading(true);
                    const data = await getMarketplaceData();
                    setMarketplaceData(data);
                } catch (error) {
                    console.error("Error fetching marketplace data:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        )();
    }, []);

    return { marketplaceData, isLoading };
}