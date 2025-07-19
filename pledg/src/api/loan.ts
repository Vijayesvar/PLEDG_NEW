import { MarketplaceItem } from "@/types/loan";

const BE_SERVER = process.env.NEXT_PUBLIC_BE_SERVER || 'http://localhost:5000/api/v1';

export const getMarketplaceData = async (): Promise<MarketplaceItem[]> => {
    try {
        const response = await fetch(
            `${BE_SERVER}/loans/marketplace`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching marketplace data:", error);
        return [];
    }
}