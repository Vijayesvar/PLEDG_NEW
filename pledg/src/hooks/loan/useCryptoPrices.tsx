import { useState, useEffect, useCallback } from 'react';

interface CryptoPrice {
    inr: number;
    inr_24h_change: number;
}

interface CryptoPrices {
    bitcoin?: CryptoPrice;
    ethereum?: CryptoPrice;
}

const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=inr&include_24hr_change=true';

export const useCryptoPrices = () => {
    const [prices, setPrices] = useState<CryptoPrices>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrices = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch(CRYPTO_API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setPrices(data);
        } catch (err) {
            console.error('Error fetching crypto prices:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch prices');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchPrices();

        // Set up interval for 15 seconds
        const interval = setInterval(fetchPrices, 15000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [fetchPrices]);

    const getPrice = (crypto: 'bitcoin' | 'ethereum'): number => {
        return prices[crypto]?.inr || 0;
    };

    const get24hChange = (crypto: 'bitcoin' | 'ethereum'): number => {
        return prices[crypto]?.inr_24h_change || 0;
    };

    const formatPrice = (crypto: 'bitcoin' | 'ethereum'): string => {
        const price = getPrice(crypto);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return {
        prices,
        loading,
        error,
        getPrice,
        get24hChange,
        formatPrice,
        refetch: fetchPrices,
    };
}; 