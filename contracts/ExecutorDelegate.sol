
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Forwarder {
    using ECDSA for bytes32;

    struct Request {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        uint256 sigChainID;
        uint256 chainID;
        bytes data;
    }

    event LogCall(address from, address to, bytes data); 

    bytes32 private constant HASHED_NAME = keccak256(bytes("CatalogForworder"));
    bytes32 private constant HASHED_VERSION = keccak256(bytes("0.0.1"));
    bytes32 private constant TYPE_HASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant _TYPEHASH =
        keccak256("Request(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint256 chainID,uint256 sigChainID,bytes data)");

    mapping(address => uint256) private _nonces;

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function domainSeperator(uint256 _chainID) public view returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, HASHED_NAME, HASHED_VERSION, _chainID, address(this)));
    }

     function hash(Request[] memory req) internal pure returns (bytes32) {
        bytes32[] memory opHashes = new bytes32[](req.length);
        for (uint i = 0; i < req.length; i++) {
            opHashes[i] = keccak256(abi.encode(_TYPEHASH, req[i].from, req[i].to, req[i].value, req[i].gas, req[i].nonce, req[i].chainID, req[i].sigChainID, keccak256(req[i].data)));
        }
        return keccak256(abi.encodePacked(opHashes));
    }


    function verify(Request[] calldata req, bytes calldata signature) public view returns (bool) {
        address signer = domainSeperator(req[0].sigChainID).toTypedDataHash(
            keccak256(abi.encode(_TYPEHASH, hash(req)))
        ).recover(signature);
        require(req[0].from == signer, "owner not signer");
    }

    function execute(Request[] calldata req,  bytes calldata signature)
        public
        payable
    {
        require(verify(req, signature), "Exec Error: signature does not match request");
        _nonces[req[0].from] = req[0].nonce + 1;
        for (uint256 i = 0; i < req.length; i ++) {
            _call(req[i]);
        }
        
    }

    function _call(Request calldata req) private {
        (bool success, bytes memory returndata) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );
        require(success, string(returndata));
        assert(gasleft() > req.gas / 63);

        emit LogCall(req.from, req.to, req.data);
    }
}