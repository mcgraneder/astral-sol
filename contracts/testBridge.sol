pragma solidity >= 0.8.9;
pragma abicoder v2;

import { IERC20 } from "./interfaces/IERC20.sol";
import "hardhat/console.sol";


interface IMintGatewayv3 {
    function getAsset() external virtual returns (string memory);
}
interface ILockGateway {
    function lock(
        string calldata recipientAddress,
        string calldata recipientChain,
        bytes calldata recipientPayload,
        uint256 amount
    ) external virtual returns (uint256);

    function release(
        bytes32 pHash,
        uint256 amount,
        bytes32 nHash,
        bytes calldata sig
    ) external virtual returns (uint256);
}


//Ren Gateway Interface needed to access the mint and burn functions which we use to bridge RenBTC
//to and from the destination chain
interface IMintGateway {

   function mint(
        bytes32 pHash,
        uint256 amount,
        bytes32 nHash,
        bytes calldata sig
    ) external virtual returns (uint256);

    function burnWithPayload(
        string calldata recipientAddress,
        string calldata recipientChain,
        bytes calldata recipientPayload,
        uint256 amount
    ) external virtual returns (uint256);

    function burn(string calldata recipient, uint256 amount) external virtual returns (uint256);
}


//Interface for the GateWay registry which allows us to get the contract address of supported bridging
//tokens offered by Ren
interface IGatewayRegistry {

   function signatureVerifier() external view virtual returns (address);

    function chainId() external view virtual returns (uint256);

    function chainName() external view virtual returns (string memory);

    function getMintGatewaySymbols(uint256 from, uint256 count) external view virtual returns (string[] memory);

    function getLockGatewaySymbols(uint256 from, uint256 count) external view virtual returns (string[] memory);

    function getMintGatewayByToken(address token) external view virtual returns (IMintGateway);

    function getMintGatewayBySymbol(string calldata tokenSymbol) external view virtual returns (IMintGateway);

    function getRenAssetBySymbol(string calldata tokenSymbol) external view virtual returns (IERC20);

    function getLockGatewayByToken(address token) external view virtual returns (ILockGateway);

    function getLockGatewayBySymbol(string calldata tokenSymbol) external view virtual returns (ILockGateway);

    function getLockAssetBySymbol(string calldata tokenSymbol) external view virtual returns (IERC20);
}


contract TestRenBridge {

    IGatewayRegistry public registry;
    address contractOwner;
    address[] owners;

    //mappings for various things like user token balances and lists of current lockAndMintId
    // and burn and release events for a given user
    mapping(address => mapping(string => uint)) tokenBalance;

    //we init the list of supported tokens in the constructor which we can add too with the addToken function
    //also init the gateway address
    constructor(
        IGatewayRegistry _registry
    ) {
        // require(mintGateways.length == tokenAddresses.length == tickers.length, "invallid constructor args");
        registry = _registry;
        contractOwner = msg.sender;
        owners.push(contractOwner);
    
    }

        function fromHexChar(uint8 c) public pure returns (uint8) {
        if (bytes1(c) >= bytes1('0') && bytes1(c) <= bytes1('9')) {
            return c - uint8(bytes1('0'));
        }
        if (bytes1(c) >= bytes1('a') && bytes1(c) <= bytes1('f')) {
            return 10 + c - uint8(bytes1('a'));
        }
        if (bytes1(c) >= bytes1('A') && bytes1(c) <= bytes1('F')) {
            return 10 + c - uint8(bytes1('A'));
        }
        return 0;
    }
    
    function hexStringToAddress(string memory s) public pure returns (bytes memory) {
        bytes memory ss = bytes(s);
        require(ss.length%2 == 0); // length must be even
        bytes memory r = new bytes(ss.length/2);
        for (uint i=0; i<ss.length/2; ++i) {
            r[i] = bytes1(fromHexChar(uint8(ss[2*i])) * 16 +
                        fromHexChar(uint8(ss[2*i+1])));
        }

        return r;

    }
    
    function toAddress(string memory s) public pure returns (address) {
        bytes memory _bytes = hexStringToAddress(s);
        require(_bytes.length >= 1 + 20, "toAddress_outOfBounds");
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), 1)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

    //admin only owner modifier. only the contract creator and people he chooses can add supporting tokens
    modifier onlyOwner() {
        bool hasBeenFound = false;
        for (uint i = 0; i < owners.length; i++) {
            if(owners[i] == msg.sender) hasBeenFound = true;
            break;
        }
        require(hasBeenFound, "only admin can call");
        _; 
    }

    //function that allows the user to withdraw their token balance from this smart
    //contract to their wallet address or anyone elses
    function transfer(
        address recipient, 
        uint256 amount, 
        string memory _tokenAddress) 
        public 
        returns (bool) {

        require(IERC20(toAddress(_tokenAddress)).balanceOf(address(this)) >= amount, "innsufficent balance");
        require(amount > 0, "cannot transfer 0 amount");

        IERC20(toAddress(_tokenAddress)).transfer(recipient, amount);

        return true;
    }

    //function that allows the user to deposit their tokens into this smart contract for the
    //purpose of transfering the, back to the tokens origunal chain. (need to call approve from the client)
    function transferFrom( 
        uint256 amount, 
        address recipient,
        string memory _tokenAddress) 
        public  
        returns (bool) {

        uint256 userWalletBalance = IERC20(toAddress(_tokenAddress)).balanceOf(recipient);
        require(userWalletBalance > amount, "insufficent funds in your wallet");
        
        IERC20(toAddress(_tokenAddress)).transferFrom(recipient, address(this), amount);
        tokenBalance[recipient][_tokenAddress] += amount;

        return true;
    }
 

   //////////////////////////Getter functions/////////////////////////////////

    function getContractTokenbalance(string memory _tokenAddress, address _owner) public view returns (uint256) {
        return IERC20(toAddress(_tokenAddress)).balanceOf(address(this));
    }

    function getUserbalanceInContract(string memory _tokenAddress, address owner) public view returns (uint256) {
        return tokenBalance[owner][_tokenAddress];
    }

    function getUserTokenBalance(string memory _tokenAddress, address _owner) public view returns (uint256) {
        return IERC20(toAddress(_tokenAddress)).balanceOf(_owner);
    }

    function totalSupplyofToken(string memory _tokenAddress) public view returns (uint256) {
        return IERC20(toAddress(_tokenAddress)).totalSupply();
    }


    function tokenAllowance(
        address owner, 
        address spender, 
        string memory _tokenAddress) 
        public view 
        returns (uint256) {

        return  IERC20(toAddress(_tokenAddress)).allowance(owner, spender);
       
    }

    function getAdmins() public view returns (address[] memory) {
        return owners;
    }
}