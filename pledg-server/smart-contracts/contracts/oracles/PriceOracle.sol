pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IPriceOracle.sol";

contract PriceOracle is IPriceOracle {
    enum OracleProvider { Chainlink, Fallback }

    struct TokenConfig {
        OracleProvider provider;
        address feedAddress;  
        uint256 fallbackPrice;
    }

    mapping(address => TokenConfig) public tokenConfigs;

    uint256 public constant USD_INR_RATE = 83500000000000000000; // 83.5 * 1e18

    constructor() {
        /**
         * Network: Amoy Testnet
         * Contract: ETH / USD
         * Address: `0x2Ef1C802355c500A3493F2Db8cB9C24AF12c42B0`
         * Oracle: Chainlink
         * Oracle Address: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
         * Fallback Price: 243823
        */
        tokenConfigs[0x2Ef1C802355c500A3493F2Db8cB9C24AF12c42B0] = TokenConfig({
            provider: OracleProvider.Chainlink,
            feedAddress: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
            fallbackPrice: 101 * 1e18
        });
    }

    /**
     * @notice Get the price of a token in INR
     * @param token The address of the token
     * @param amount The amount of the token
     * @return The price of the token in INR
     */
    function getTokenPriceInINR(address token, uint256 amount) public view returns (uint256) {
        TokenConfig memory config = tokenConfigs[token];

        if (config.provider == OracleProvider.Chainlink && config.feedAddress != address(0)) {
            return _getChainlinkPriceInINR(config.feedAddress, amount);
        }

        if (config.provider == OracleProvider.Fallback && config.fallbackPrice > 0) {
            return _getFallbackPriceInINR(config.fallbackPrice, amount);
        }

        // Default fallback for testing - assume 1 token = $3000 USD = ₹255,900 INR
        uint256 defaultPriceInUSD = 3000 * 1e18; // $3000 in wei
        return _getFallbackPriceInINR(defaultPriceInUSD, amount);
    }

    /**
     * @notice Get the price of a token in INR using Chainlink
     * @param feedAddress The address of the Chainlink price feed
     * @param amount The amount of the token
     * @return The price of the token in INR
     */
    function _getChainlinkPriceInINR(address feedAddress, uint256 amount) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        uint8 decimals = priceFeed.decimals();
        uint256 normalizedPrice = uint256(price) * 1e18 / (10 ** decimals);
        uint256 usdValue = normalizedPrice * amount / (1e18);
        uint256 inrValue = usdValue * USD_INR_RATE / 1e18;
        return inrValue;
    }

    /**
     * @notice Get the price of USD in INR
     * @return The price of USD in INR
     */
    function _getINRPerUSD() internal pure returns (uint256) {
        return 85.53 * 1e18;
    }

    /**
     * @notice Get the price of a token in INR using Chainlink
     * @param fallbackPrice The price of the token in INR
     * @param amount The amount of the token
     * @return The price of the token in INR
     */
    function _getFallbackPriceInINR(uint256 fallbackPrice, uint256 amount) internal pure returns (uint256) {
        uint256 inrPerUSD = 8553 * 1e16; // 85.53 * 1e18
        require(fallbackPrice > 0, "Fallback price must be > 0");
        require(amount > 0, "Amount must be > 0");
        require(inrPerUSD > 0, "INR per USD must be > 0");
        return fallbackPrice * amount * inrPerUSD / (1e18 * 1e18);
    }
}