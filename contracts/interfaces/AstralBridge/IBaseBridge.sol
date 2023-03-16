pragma solidity >= 0.8.9;

interface IBaseBridge {
    function burn(address to, uint amount) external;
    function mint(address to, uint amount, uint otherChainNonce) external;
}