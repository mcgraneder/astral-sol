pragma solidity >= 0.8.9;

import {LinkedList} from "../utils/LinkedList.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";



contract TestNativeAssetRegistry is Ownable {

    uint8 numOfAssets = 0;
    LinkedList.List private testNativeERC20Assets;

    constructor(address[] memory _initialTokens) {
        numOfAssets = uint8(_initialTokens.length);
        for (uint i = 0; i < _initialTokens.length; i++) {
            //again could verify addres here but this is mock contract
            LinkedList.append(testNativeERC20Assets,  _initialTokens[i]);
        }
    }

    //do other checks such as does address exist or is it valid ERC20 token.
    //this is a mock so not really important to do this here
    function registerNativeERC20Asset(address asset) public onlyOwner {
        require(
                !LinkedList.isInList(testNativeERC20Assets,asset), 
                "asset already registered"
        );
        LinkedList.append(testNativeERC20Assets,  asset);
        numOfAssets++;

    }

    function getAllNaitveERC20Asset() public view returns (address[] memory) {
        address firstAddress = LinkedList.begin(testNativeERC20Assets);
        address[] memory allAssets = LinkedList.elements(testNativeERC20Assets, firstAddress, numOfAssets);
        return allAssets;
    }

    function getNumAssets() public view returns(uint8) {
        return numOfAssets;
    }

}