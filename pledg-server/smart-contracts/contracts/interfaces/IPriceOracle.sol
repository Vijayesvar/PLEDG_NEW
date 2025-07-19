pragma solidity ^0.8.20;

interface IPriceOracle {
    /**
     * @notice Get the price of a token in INR
     * @param token The address of the token
     * @param amount The amount of the token
     * @return The price of the token in INR
     */
    function getTokenPriceInINR(address token, uint256 amount) external view returns (uint256);
}
