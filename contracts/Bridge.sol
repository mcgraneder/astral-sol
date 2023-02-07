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


contract RenBridge {

    IGatewayRegistry public registry;

    uint256 lockAndMintId = 0;
    uint256 burnAndReleaseId = 0;

    //token struct which we can use to add supported tokens to our bridge
    struct Token {
        string ticker;
        address tokenAddress;
        address mintGateway;
    }

    //lock and mint struct which we use to initialise a lock and mint event
    struct LockAndMints {

        uint256 id;
        string asset;
        uint256 amount;
        uint256 timeOfCreation;
    }

    //burn and release struct which we use to init a burn and release event
    struct BurnAndReleases {

        uint256 id;
        string asset;
        uint256 amount;
        uint256 timeOfCreation;
    }

    string[] tokenList;
    address contractOwner;
    address[] owners;

    //mappings for various things like user token balances and lists of current lockAndMintId
    // and burn and release events for a given user
    mapping(string => Token) tokenMapping;
    mapping(address => mapping(string => uint)) tokenBalance;
    mapping(address => LockAndMints[]) depositList;
    mapping(address => BurnAndReleases[]) withdrawalList;


    //we init the list of supported tokens in the constructor which we can add too with the addToken function
    //also init the gateway address
    constructor(IGatewayRegistry _registry) {

        registry = _registry;
        contractOwner = msg.sender;
        owners.push(contractOwner);
        
        //  for (uint i = 0; i < _tokens.length; i++) {
        //     address mintGateway = address(registry.getMintGatewayByToken(toAddress(_tokens[i])));
        //     address assetSymbol = address(registry.getMintGatewayBySymbol(symbols[i]));
        //     // require(mintGateway != address(0), "unsupported token");
        //     // string memory assetSymbol
        //     // if(legacyIMintGatewayv3(mintGateway).getAsset();
        //     tokenMapping[_tokens[i]] = Token(assetSymbol, toAddress(_tokens[i]), mintGateway);
        //     tokenList.push(assetSymbol);
        // }
    }

        // function getLegacyTickers(strintokenAddress) private view returns (string memory) {
        //     if (tokenAddress == "0x880Ad65DC5B3F33123382416351Eef98B4aAd7F1") return "BTC";
        //     else return "BTC";
        // }

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

    //modifier to check if a token exists. we need this to prevet adding non supported bridge tokens
    //or conversley tokens that dont exists at all
    modifier tokenExists(string memory _tokenAddress) {

        require(tokenMapping[_tokenAddress].tokenAddress != address(0));
        _;
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

    //events
    event Deposit(uint256 _amount, bytes _msg);
    event Withdraw(bytes _to, uint256 _amount, bytes _msg);
    event tokenAdded(string ticker, address tokenAddress);
    event ownerAdded(address owner, uint256 time);
    event ownerRemoved(address owner, uint256 time);

    event depositInitialized(
        string asset, 
        uint256 id, 
        uint256 amount, 
        address depositedBy, 
        uint256 timeOfCreation);

    event withdrawalInitialized(
        string asset, 
        uint256 id, 
        uint256 amount, 
        address withdrawedBy, 
        uint256 timeOfCreation);

    
    //function that allows the admins to update the list of supported brifge tokens. this alllows
    //the contract to be relevant as ren support new tokens in the future
    function addToken( 
        string memory _ticker,
        address tokenAddress
        ) public 
        onlyOwner() 
        returns (bool) {

        // for (uint i = 0; i < tokenList.length; i++) {

        //     require(keccak256(bytes(tokenList[i])) != keccak256(bytes(_ticker)), "token has already been added"); 
        // }
        // require(keccak256(bytes(IERC20(tokenAddress).symbol())) == keccak256(bytes(_ticker)), "inputted ticker does not match the token symbol");

        address mintGateway = address(registry.getMintGatewayByToken(tokenAddress));
        tokenMapping[_ticker] = Token(_ticker, tokenAddress, mintGateway);
        tokenList.push(_ticker);

        return true;
    }

    //function that allows the contract creator to give admin status to other people so that they can
    //execute admin functions such as adding tokens
     function addOwner(
        address _owner) 
        public 
        onlyOwner() 
        returns (bool) {

        for (uint user = 0; user < owners.length; user++) {

            require(owners[user] != _owner, "Already registered");
        }

        require(owners.length <= 5);
        owners.push(_owner);

        emit ownerAdded(_owner, block.timestamp);

        return true;
    }

    //function that allows contract creator to remove admin status from existing owners
    function removeOwner(address owner) public onlyOwner() returns (bool) {

        bool hasBeenFound = false;
        uint256 ownerIndex;
        for (uint i = 0; i < owners.length; i++) {

            if (owners[i] == owner) {

                hasBeenFound = true;
                ownerIndex = i;
                break;
            }
        }

        require(hasBeenFound, "owner does not exist");

        owners[ownerIndex] = owners[owners.length - 1];
        owners.pop();

        emit ownerAdded(owner, block.timestamp);

        return true;
    }


    //deposit function that executes LockAndMint from RenJs in the client
    function deposit(
       // Parameters from users
        string calldata _tokenAddress,
        string calldata _msg,
        // Parameters from RenVM
        uint256 _amount,
        bytes32 _nHash,
        bytes calldata _sig) 
        external  {

        LockAndMints[] storage deposits = depositList[msg.sender];
        deposits.push(
            LockAndMints(
            lockAndMintId, 
            _tokenAddress, 
            _amount, 
            block.timestamp
        ));

        bytes32 pHash = keccak256(abi.encode(_tokenAddress, _msg));
        uint256 mintedAmount = registry.getMintGatewayByToken(toAddress(_tokenAddress)).mint(pHash, _amount, _nHash, _sig);

        tokenBalance[msg.sender][_tokenAddress] +=_amount;
        lockAndMintId++;

        emit Deposit(mintedAmount, bytes(_msg));
    }

    //withdrawal function that executes burnAndRelease from RenJs in the client
    function withdraw(
       string calldata _tokenAddress,
        string calldata _msg,
        string calldata _to,
        uint256 _amount) 
        external {

        BurnAndReleases[] storage widthdrawals = withdrawalList[msg.sender];
        widthdrawals.push(
            BurnAndReleases(
            burnAndReleaseId, 
            _tokenAddress, 
            _amount, 
            block.timestamp
        ));

        require(tokenBalance[msg.sender][_tokenAddress] >= _amount, "insufficent balance");
        require(_amount != 0, "cannot withdraw zero tokens");

        tokenBalance[msg.sender][_tokenAddress] -=_amount;

        uint256 burnedAmount = registry.getMintGatewayByToken(toAddress(_tokenAddress)).burn(_to, _amount);
        burnAndReleaseId++;

        emit Withdraw(bytes(_to), burnedAmount, bytes(_msg));
    }

    //function that allows the user to withdraw their token balance from this smart
    //contract to their wallet address or anyone elses
    function transfer(
        address recipient, 
        uint256 amount, 
        string memory _tokenAddress) 
        public 
        tokenExists(_tokenAddress) 
        returns (bool) {

        require(tokenBalance[msg.sender][_tokenAddress] >= amount, "innsufficent balance");
        require(amount > 0, "cannot transfer 0 amount");

        tokenBalance[msg.sender][_tokenAddress] -= amount;
        IERC20(toAddress(_tokenAddress)).transfer(recipient, amount);

        return true;
    }

    //function that allows the user to deposit their tokens into this smart contract for the
    //purpose of transfering the, back to the tokens origunal chain. (need to call approve from the client)
    function transferFrom( 
        uint256 amount, 
        string memory _tokenAddress) 
        public  
        returns (bool) {

        uint256 userWalletBalance = IERC20(toAddress(_tokenAddress)).balanceOf(msg.sender);
        require(userWalletBalance > amount, "insufficent funds in your wallet");
        
        IERC20(toAddress(_tokenAddress)).transferFrom(msg.sender, address(this), amount);
        tokenBalance[msg.sender][_tokenAddress] += amount;

        return true;
    }
 

   //////////////////////////Getter functions/////////////////////////////////

    function getContractTokenbalance(string memory _tokenAddress) public view returns (uint256) {

        return IERC20(toAddress(_tokenAddress)).balanceOf(address(this));
    }

    function getUserbalanceInContract(string memory _tokenAddress) public view returns (uint256) {

        return tokenBalance[msg.sender][_tokenAddress];
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

    function getLockAndMints() public view returns (LockAndMints[] memory) {

        return depositList[msg.sender];
    }

     function getLockBurnAndReleases() public view returns (BurnAndReleases[] memory) {

        return withdrawalList[msg.sender];
    }

     function getTokenList() public view returns (string[] memory) {

        return tokenList;
    }

    // function getTokenAddressBySymbol(string memory _ticker) public view returns (IERC20) {

    //     return registry.getTokenBySymbol(_ticker);
    // }

    function getAdmins() public view returns (address[] memory) {

        return owners;
    }
}