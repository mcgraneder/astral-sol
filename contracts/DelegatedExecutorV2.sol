
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";


//version 2 aims to ttackle some of the main nuannces and limitations of the base minimal forwarder.
//namely that we can inly execute a single transaction. In this contract i have asse a UserOperation TYPEHASH
//ao that we can use nested tranacctuion Metadata calls in our modified call function
contract ForwarderV2 {
    using ECDSA for bytes32;

    struct UserOperation {
        address to;
        uint256 amount;
        bytes data;
    }

    event LogReceivedEther(address indexed _from, uint256 _amount);
    event LogCall(address indexed _contract, uint256 _value, bytes _data);

    bytes32 private constant HASHED_NAME = keccak256(bytes("Executor"));
    bytes32 private constant HASHED_VERSION = keccak256(bytes("0.0.1"));
    bytes32 private constant TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant UserOp_TYPE_HASH = keccak256("UserOperation(address to,uint256 amount,bytes data)");
    bytes32 private constant _TYPEHASH =
        keccak256("ECDSAExec(UserOperation[] userOps,uint256 nonce,uint256 chainID,uint256 sigChainID)UserOperation(address to,uint256 amount,bytes data)");

    mapping(address => uint256) private _nonces;

     receive() external payable {
           
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function domainSeperator(uint256 _chainID) public view returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, HASHED_NAME, HASHED_VERSION, _chainID, address(this)));
    }

    function _incrementNonce(address from) internal {
        uint256 nonce = getNonce(from);
        nonce += 1;
    }

    function hash(UserOperation[] memory _userOps) internal pure returns (bytes32) {
        bytes32[] memory opHashes = new bytes32[](_userOps.length);
        for (uint i = 0; i < _userOps.length; i++) {
            opHashes[i] = keccak256(
                abi.encode(
                    UserOp_TYPE_HASH, 
                    _userOps[i].to, 
                    _userOps[i].amount, 
                    keccak256(_userOps[i].data)
                )
            );
        }
        return keccak256(abi.encodePacked(opHashes));
    }

    function _verify(UserOperation[] memory _userOps, bytes memory _signature, address from) internal view  {
        (uint256 _sigChainID, bytes memory _sig) = abi.decode(_signature, (uint256, bytes));
        address signer = domainSeperator(_sigChainID).toTypedDataHash(
            keccak256(
                abi.encode(_TYPEHASH,
                hash(_userOps),
                getNonce(from), 
                block.chainid, 
                _sigChainID)
            )
        ).recover(_sig);
        // require(from == signer, "Executor: failed to verify signature");
    }

   
     function exec(UserOperation[] calldata userOps, bytes calldata _signature, address from) external {
        _verify(userOps, _signature, from);
        _incrementNonce(from);
        for (uint32 i = 0; i < userOps.length; i++) {
            require(
                address(this).balance >= userOps[i].amount, 
                "Executor: insufficient base asset balance"
            );
            _call(userOps[i].to, userOps[i].amount, userOps[i].data, from);
        }
    }

    function _call(address _contract, uint256 _value, bytes calldata _data, address from) internal {
        (bool ok, bytes memory resp) = _contract.call{ value: _value }(abi.encodePacked(_data, from));
        emit LogCall(_contract, _value, _data);
        if (!ok) {
            assembly {
                revert(add(resp, 32), mload(resp))
            }
        }
    }
}