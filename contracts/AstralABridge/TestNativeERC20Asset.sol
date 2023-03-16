pragma solidity >= 0.8.9;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestNativeERC20Asset is ERC20 {

    uint8 internal tokenDecimals;

    constructor(
        string memory _symbol, 
        string memory _name, 
        uint8 _decimals, 
        uint256 _amountToMint
    ) ERC20(_symbol, _name) {
        tokenDecimals = _decimals;
        _mint(msg.sender, _amountToMint);
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}

