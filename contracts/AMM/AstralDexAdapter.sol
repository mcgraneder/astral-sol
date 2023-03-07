//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IGatewayRegistry} from "@renproject/gateway-sol/src/GatewayRegistry/interfaces/IGatewayRegistry.sol";
import {IMintGateway} from "@renproject/gateway-sol/src/Gateways/interfaces/IMintGateway.sol";
import {ILockGateway} from "@renproject/gateway-sol/src/Gateways/interfaces/ILockGateway.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Lender} from "./Lender.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {String} from "@renproject/gateway-sol/src/libraries/String.sol";
import {Payment} from "./libraries/Payment.sol";

address constant FEE_CURRENCY = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

interface RenAdapter {
    function permissionedWithdraw(address _from, address _to, address _token, uint256 _amount) external;
}

contract AstralAdapter is Context, ERC2771Context, AccessControlEnumerable, Payment {
    using SafeERC20 for IERC20;

    IGatewayRegistry public registry;
    Lender public lender;
    RenAdapter public catalogAdapter;

    bytes32 public constant RELAYER = keccak256("RELAYER");
    bytes32 public constant BRIDGE_ADMIN = keccak256("BRIDGE_ADMIN");

    event BridgeAndCall();

    mapping(address => bool) public allowedContracts;
    mapping(address => uint256) nonces;

    uint256 public maxFeeBips;

    constructor(
        IGatewayRegistry registry_,
        Lender lender_,
        address roleAdminAddress,
        address[] memory relayers,
        address forwarder,
        RenAdapter catalogAdapter_
    ) payable ERC2771Context(forwarder) {
        registry = registry_;
        lender = lender_;
        AccessControlEnumerable._grantRole(AccessControl.DEFAULT_ADMIN_ROLE, roleAdminAddress);
        AccessControlEnumerable._grantRole(BRIDGE_ADMIN, roleAdminAddress);
        for (uint256 i = 0; i < relayers.length; ++i) {
            AccessControlEnumerable._grantRole(RELAYER, relayers[i]);
        }
        catalogAdapter = catalogAdapter_;
    }

    modifier verifyNonce(address user, uint256 nonce) {
        require(nonce == nonces[user], "BoundlessAdapter: Invalid nonce");
        nonces[user] = nonces[user] + 1;
        _;
    }

    function getNonce(address user) public view returns (uint256) {
        return nonces[user];
    }

    function forwardBalanceToLender(IERC20 erc20) public {
        erc20.safeTransfer(address(lender), erc20.balanceOf(address(this)));
    }

    function updateMaxFeeBips(uint256 newMaxFeeBips) public onlyRole(BRIDGE_ADMIN) {
        maxFeeBips = newMaxFeeBips;
    }

    function allowContract(address contractAddress, bool allowed) public onlyRole(BRIDGE_ADMIN) {
        require(contractAddress != address(lender), "Lender contract can not be allowed.");
        allowedContracts[contractAddress] = allowed;
    }

    struct ContractCallParams {
        /// The contract to call after bridging the Ren-asset
        address contractAddress;
        /// The contract call's data
        bytes data;
        address outputToken;
    }

    struct TxParams {
        string asset;
        bytes txID;
        uint256 fee;
        bool borrowAsset;
        address payable fallbackRecipient;
        ContractCallParams[] contractCalls;
    }

    function borrowAndCall(
        TxParams calldata txParams,
        uint256 nonce,
        uint256 amount
    ) public verifyNonce(txParams.fallbackRecipient, nonce) {
        require(hasRole(RELAYER, _msgSender()), "Bridge: only relayer can borrow");

        address token = _getAssetBySymbol(txParams.asset);
        uint256 borrowedAmount = lender.borrow(token, txParams.txID, amount - txParams.fee);
        _call(token, borrowedAmount, txParams.fallbackRecipient, txParams.contractCalls);
    }

    // Bridge assets before calling the contract calls.
    function bridgeAndCall(
        //
        // Parameters from users (in payload)
        //
        TxParams calldata txParams,
        // Parameters from Darknodes (not in payload)
        //
        uint256 amount,
        bytes32 nHash,
        bytes calldata signature
    ) public {
        if (lender.loans(txParams.txID) > 0) {
            return _bridgeAndRepay(txParams, amount, nHash, signature);
        }

        if (txParams.borrowAsset) {
            require(hasRole(RELAYER, _msgSender()), "Bridge: only relayer can bridge from lender");
        } else {
            require(
                _msgSender() == txParams.fallbackRecipient || hasRole(RELAYER, _msgSender()),
                "Bridge: only recipient or relayer can submit"
            );
        }
        require(txParams.fee <= ((amount * maxFeeBips) / 10000), "Bridge: invalid fee");

        address token = _getAssetBySymbol(txParams.asset);

        // Add `0` to replace the fee and confirmations, which aren't in the payload.
        bytes32 pHash = keccak256(abi.encode(txParams));
        uint256 bridgedAmount = _bridgeOrBorrow(txParams, pHash, amount, nHash, signature);

        _call(token, bridgedAmount, txParams.fallbackRecipient, txParams.contractCalls);

        emit BridgeAndCall();
    }

    function call(
        address inputToken,
        uint256 inputAmount,
        address payable fallbackRecipient,
        ContractCallParams[] calldata contractCalls
    ) public payable {
        if (inputToken == FEE_CURRENCY) {
            require(inputAmount == msg.value, "BoundlessAdapter: Input amount must match msg.value");
        } else {
            IERC20(inputToken).safeTransferFrom(_msgSender(), address(this), inputAmount);
        }
        _call(inputToken, inputAmount, fallbackRecipient, contractCalls);
    }

    function callFromCatalog(
        address inputToken,
        uint256 inputAmount,
        address payable fallbackRecipient,
        ContractCallParams[] calldata contractCalls
    ) public payable {
        catalogAdapter.permissionedWithdraw(_msgSender(), address(this), inputToken, inputAmount);
        _call(inputToken, inputAmount, fallbackRecipient, contractCalls);
    }

    function _call(
        address inputToken,
        uint256 inputAmount,
        address payable fallbackRecipient,
        ContractCallParams[] calldata contractCalls
    ) private {
        for (uint256 i = 0; i < contractCalls.length; i++) {
            require(allowedContracts[contractCalls[i].contractAddress], "BoundlessAdapter: unapproved contract call");

            address outputToken = contractCalls[i].outputToken;

            uint256 value = inputToken == FEE_CURRENCY ? inputAmount : 0;

            uint256 outputTokenBalanceBefore = 0;
            if (outputToken != address(0x0)) {
                outputTokenBalanceBefore = outputToken == FEE_CURRENCY
                    ? address(this).balance
                    : IERC20(outputToken).balanceOf(address(this));
                if (inputToken == outputToken) {
                    outputTokenBalanceBefore = outputTokenBalanceBefore - inputAmount;
                }
            }

            if (inputToken != address(0x0) && inputToken != FEE_CURRENCY) {
                IERC20(inputToken).safeApprove(contractCalls[i].contractAddress, inputAmount);
            }

            (bool success, bytes memory returnData) = contractCalls[i].contractAddress.call{
                gas: gasleft() - 3000,
                value: value
            }(contractCalls[i].data);
            if (!success) {
                if (returnData.length < 68) {
                    revert("BoundlessAdapter: Internal contract call reverted");
                }

                // revert(string(returnData));
                assembly {
                    revert(add(returnData, 32), returnData)
                }
            }

            if (address(inputToken) != address(0x0) && inputToken != FEE_CURRENCY) {
                uint256 approvalRemaining = IERC20(inputToken).allowance(
                    address(this),
                    contractCalls[i].contractAddress
                );
                if (approvalRemaining > 0) {
                    // Reset approval to 0.
                    IERC20(inputToken).safeApprove(contractCalls[i].contractAddress, 0);
                    // Transfer unused amount to fallbackRecipient.
                    IERC20(inputToken).safeTransfer(fallbackRecipient, approvalRemaining);
                }
            }

            // Set input token and amount for next call.
            inputToken = outputToken;
            inputAmount = 0;
            if (outputToken == FEE_CURRENCY) {
                if (address(this).balance > outputTokenBalanceBefore) {
                    inputAmount = address(this).balance - outputTokenBalanceBefore;
                }
            } else if (outputToken != address(0x0)) {
                uint256 outputBalance = IERC20(outputToken).balanceOf(address(this));
                if (outputBalance > outputTokenBalanceBefore) {
                    inputAmount = outputBalance - outputTokenBalanceBefore;
                }
            }

            outputToken == address(0x0) ? 0 : outputToken == FEE_CURRENCY
                ? address(this).balance - outputTokenBalanceBefore
                : IERC20(outputToken).balanceOf(address(this)) - outputTokenBalanceBefore;
        }

        // Send final amount to user.
        if (inputAmount > 0 && address(inputToken) != address(0x0)) {
            payToken(fallbackRecipient, inputToken, inputAmount);
        }
    }

    // Allow the relayer to submit a bridge recovery.
    function _recover(
        TxParams calldata txParams,
        //
        // Parameters from Darknodes (not in payload)
        //
        uint256 amount,
        bytes32 nHash,
        bytes calldata signature
    ) public onlyRole(RELAYER) {
        if (lender.loans(txParams.txID) > 0) {
            return _bridgeAndRepay(txParams, amount, nHash, signature);
        }
        {
            bytes32 pHash = keccak256(abi.encode(txParams));
            uint256 amountBridged = _bridgeOrBorrow(txParams, pHash, amount, nHash, signature);
            address assetAddress = _getAssetBySymbol(txParams.asset);
            payToken(txParams.fallbackRecipient, assetAddress, amountBridged);
        }
    }

    // PRIVATE FUNCTIONS ///////////////////////////////////////////////////////

    function _bridgeAndRepay(
        TxParams calldata txParams,
        //
        // Parameters from Darknodes (not in payload)
        //
        uint256 amount,
        bytes32 nHash,
        bytes calldata signature
    ) private {
        bytes32 pHash = keccak256(abi.encode(txParams));
        address token = _getAssetBySymbol(txParams.asset);
        uint256 bridgedAmount = _mintOrRelease(txParams.asset, pHash, amount, nHash, signature);
        uint256 value = msg.value;
        if (token != FEE_CURRENCY) {
            IERC20(token).safeApprove(address(lender), bridgedAmount);
            value = 0;
        }
        uint256 returned = lender.repay{value: value}(address(token), txParams.txID, bridgedAmount);

        // If the amount bridged is greater than the loan, pay the difference to
        // the user.
        if (returned > 0) {
            payToken(txParams.fallbackRecipient, token, returned);
        }
    }

    function _getAssetBySymbol(string calldata asset) internal view returns (address) {
        address renAsset = address(registry.getRenAssetBySymbol(asset));
        if (address(renAsset) != address(0x0)) {
            return renAsset;
        }
        address lockAsset = address(registry.getLockAssetBySymbol(asset));
        if (address(lockAsset) != address(0x0)) {
            return lockAsset;
        }
        return FEE_CURRENCY;
    }

    function _mintOrRelease(
        string calldata asset,
        bytes32 pHash,
        uint256 amount,
        bytes32 nHash,
        bytes calldata signature
    ) internal returns (uint256) {
        IMintGateway mintGateway = registry.getMintGatewayBySymbol(asset);
        if (address(mintGateway) != address(0x0)) {
            return mintGateway.mint(pHash, amount, nHash, signature);
        }
        ILockGateway lockGateway = registry.getLockGatewayBySymbol(asset);
        return lockGateway.release(pHash, amount, nHash, signature);
    }

    function _bridgeOrBorrow(
        TxParams calldata txParams,
        bytes32 pHash,
        uint256 amount,
        bytes32 nHash,
        bytes calldata signature
    ) internal returns (uint256) {
        if (txParams.borrowAsset) {
            return lender.borrow(_getAssetBySymbol(txParams.asset), txParams.txID, amount - txParams.fee);
        } else {
            uint256 amountBridged = _mintOrRelease(txParams.asset, pHash, amount, nHash, signature);
            if (txParams.fee > 0) {
                address assetAddress = _getAssetBySymbol(txParams.asset);
                payToken(address(lender), assetAddress, txParams.fee);
            }
            return amountBridged - txParams.fee;
        }
    }

    // ERC2771 /////////////////////////////////////////////////////////////////

    /// @notice returns the msgSender (signer for meta txs and sender for normal txs)
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    /// @notice returns the msgData (internal data obj for meta txs and msg.data for normal txs)
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}