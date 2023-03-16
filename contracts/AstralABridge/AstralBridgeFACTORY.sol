// SPDX-License-Identifier: GPL-3.0

// solhint-disable-next-line
pragma solidity ^0.8.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AstralERC20Logic} from "./AstralERC20Asset/AstralERC20.sol";
import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LinkedList} from "../utils/LinkedList.sol";
import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {IBaseBridge} from "../interfaces/AstralBridge/IBaseBridge.sol";
import {AstralAssetVault} from "./AstralERC20Asset/AstralAssetValut.sol";
import "hardhat/console.sol";

contract AstralBridgeFactory is Ownable {

    address signatureVerifier;
    uint8 numAstralAssets = 0;
    LinkedList.List private AstralAssetAddresses;
    LinkedList.List private AstralAssetBridgeAddresses;

    event AstralAssetDeployed(
        uint256 chainId,
        string name,
        string symbol,
        uint8 decimals,
        uint256 timestamp
    );


    event AstralAssetBridgeDeployed(
        uint256 chainId,
        string asset,
        address bridge,
        uint256 timestamp
    );

    mapping(string => address) symbolToAstralAsset;
    mapping(address => address) addressToAstralBridge;
    mapping(string => address) symbolToAstralBridge;

    constructor(address _signatureVerifier) public {
        signatureVerifier = _signatureVerifier;
       //will add sig and access control params later
    }

    function deployAssetAndBridge(
        string calldata asset, 
        string calldata name, 
        string calldata symbol,
        address parentAsset,
         uint8 decimals 
    ) public onlyOwner returns (address, address) {
        //check if asset exists
        address a = symbolToAstralAsset[symbol];
  
        AstralERC20Logic token = _deployAstralAsset(block.chainid, asset, name, symbol, decimals, parentAsset);
        address bridge = address( _deployAssetBridge(asset, symbol, signatureVerifier, address(token), block.chainid));
        token.transferOwnership(bridge);
        numAstralAssets+=1;

        return (address(token), bridge);
    }

    function _deployAstralAsset(
        uint256 chainId,
        string calldata asset,
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        address parentToken
    ) internal returns (AstralERC20Logic) {
        bytes memory encodedParameters = abi.encodeWithSignature(
            // chainId,
            name,
            symbol,
            decimals
        );

        // bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));
        AstralERC20Logic astralAsset = new AstralERC20Logic(name, symbol, decimals, block.chainid, 300, parentToken);
        symbolToAstralAsset[symbol] = address(astralAsset);
        LinkedList.append(AstralAssetAddresses, address(astralAsset));

        emit AstralAssetDeployed(chainId, name, symbol, decimals, block.timestamp);

        return AstralERC20Logic(astralAsset);
    }

    function _deployAssetBridge(
        string calldata asset,
        string calldata symbol,
        address signatureVerifier,
        address token,
        uint256 chainId
    ) internal returns (IBaseBridge) {
        bytes memory encodedParameters = abi.encodeWithSignature(
            asset,
            signatureVerifier,
            token
        );

        // bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));

        console.log("signature veridier in test", signatureVerifier);
        BridgeBase assetBridge = new BridgeBase(signatureVerifier, token);
        symbolToAstralBridge[symbol] = address(assetBridge);
        addressToAstralBridge[token] = address(assetBridge);
        LinkedList.append(AstralAssetBridgeAddresses, address(assetBridge));

        emit AstralAssetBridgeDeployed(chainId, asset, address(assetBridge), block.timestamp);

        return IBaseBridge(address(assetBridge));
    }

    function getAllAstralAndBridgesAssets() public view returns (address[] memory, address[] memory) {
        address firstAssetAddress = LinkedList.begin(AstralAssetAddresses);
        address firstBridgeAddress = LinkedList.begin(AstralAssetBridgeAddresses);

        address[] memory allAssets = LinkedList.elements(AstralAssetAddresses, firstAssetAddress, numAstralAssets);
        address[] memory allBridges = LinkedList.elements(AstralAssetBridgeAddresses, firstBridgeAddress, numAstralAssets);
        return (allAssets, allBridges);
    }

    function setAstralAsset(string memory symbol) public {
        symbolToAstralAsset[symbol] = msg.sender;
    }
    function getNumAssets() public view returns(uint8) {
        return numAstralAssets;
    }

    function getAssetBySymbol(string memory _symbol) public view returns (address) {
        return symbolToAstralAsset[_symbol];
    }

        function getBridgeBySymbol(string memory _symbol) public view returns (address) {
        return symbolToAstralBridge[_symbol];
    }

}