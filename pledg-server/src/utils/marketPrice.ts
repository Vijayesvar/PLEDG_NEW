export async function fetchMarketPrice({ collateral }: {collateral: 'eth' | 'btc'}) {
    try {
        const coin = collateral === 'eth' ? 'ethereum' : 'bitcoin';
        const result = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=inr&include_24hr_change=true`)
        
        if (!result.ok) {
            throw new Error('Failed to fetch market price');
        }
        
        const data = await result.json() as Record<string, { inr: number; inr_24h_change: number }>;
        const inrPrice = data[coin]?.inr;
        
        if (!inrPrice) {
            throw new Error('Invalid response from market price API');
        }
        
        return inrPrice;
    } catch (error) {
        console.error('Error fetching market price:', error);
        throw new Error('Failed to fetch market price');
    }
}