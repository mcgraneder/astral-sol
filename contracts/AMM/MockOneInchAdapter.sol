//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IGatewayRegistry} from "@renproject/gateway-sol/src/GatewayRegistry/interfaces/IGatewayRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SwapDescription} from "./OneInchAdapter.sol";
import {Payment} from "./libraries/Payment.sol";

address constant FEE_CURRENCY = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

contract MockOneInch is Context, Payment, AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant DESTROYER = keccak256("DESTROYER");

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function tokenLiquidity(address token) public view returns (uint256) {
        if (token == FEE_CURRENCY) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    function destroy(address to, address[] calldata tokens) public {
        require(hasRole(DESTROYER, _msgSender()), "MockOneInch: must have destroyer role to destroy");
        if (to == address(0)) {
            to = _msgSender();
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).safeTransfer(to, IERC20(tokens[i]).balanceOf(address(this)));
        }
        selfdestruct(payable(to));
    }

    function calculateDstAmount(address srcToken, address dstToken, uint256 srcAmount) public view returns (uint256) {
        uint256 srcTokenBalance = tokenLiquidity(srcToken);
        uint256 dstTokenBalance = tokenLiquidity(dstToken);
        if (srcTokenBalance == 0) {
            return srcAmount;
        }
        uint256 denominator = (srcAmount + srcTokenBalance);
        return ((dstTokenBalance * (denominator - srcTokenBalance)) / denominator);
    }

    function deposit(address token, uint256 amount) public payable {
        acceptPayment(token, amount);
    }

    function swap(
        address _caller,
        SwapDescription calldata desc,
        bytes calldata _data
    ) public payable returns (uint256) {
        uint256 dstAmount = calculateDstAmount(address(desc.srcToken), address(desc.dstToken), desc.amount);

        // Receive the payment from the user.
        acceptPayment(address(desc.srcToken), desc.amount);

        // Pay the output amount to the user.
        payToken(desc.dstReceiver, address(desc.dstToken), dstAmount);

        return dstAmount;
    }
}