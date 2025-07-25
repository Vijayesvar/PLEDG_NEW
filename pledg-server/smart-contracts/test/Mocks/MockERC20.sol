// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity 0.8.7;
import { ERC20 } from "../../src/ERC20.sol";
contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_, decimals_) {}
    function mint(address recipient_, uint256 amount_) external {
        _mint(recipient_, amount_);
    }
    function burn(address owner_, uint256 amount_) external {
        _burn(owner_, amount_);
    }
}