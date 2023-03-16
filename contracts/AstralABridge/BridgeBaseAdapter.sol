pragma solidity >= 0.8.9;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {AstralERC20Logic} from "./AstralERC20Asset/AstralERC20.sol";
import {TestNativeAssetRegistry} from "./tesNativeAssetRegistry.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AstralAssetVault} from "./AstralERC20Asset/AstralAssetValut.sol";
import "hardhat/console.sol";

interface IToken {
  function mint(address to, uint amount) external;
  function burn(address owner, uint amount) external;
}

contract BridgeBase {

  address public admin;
  AstralERC20Logic public token;
  uint256 mintFee = 0; //for now
  uint256 burnFee = 0; //fornow
  uint256 lockMintNonce = 0;
  uint256 burnReleaseNonce = 0;

  mapping(uint => bool) public processedBurnNonces;
  mapping(uint => bool) public processedLockNonces;

  mapping(address => uint256) lockBalance;

  enum Step { Burn, Mint }

  event MintEvent(
    address from,
    address to,
    uint amount,
    uint date,
    uint nonce,
    Step indexed step
  );

  event ReleaseEvent(
    address from,
    address to,
    uint amount,
    uint date,
    uint nonce,
    Step indexed step
  );

   event AssetLocked(
        address _for,
        uint amount,
        uint256 timestamp,
        uint256 nonce
    );
    event AssetBurnt(
        address _for,
        uint amount,
        uint256 timestamp,
        uint256 nonce
    );

  constructor(address _admin, address _token) {
  
    admin = _admin;
    token = AstralERC20Logic(_token);
  }

  function bridge(
    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    address to, 
    uint amount, 
    uint otherChainNonce,
    string memory bridgeAction,
    address token
  ) external {
    bytes32 BridgeAction =  keccak256(bytes(bridgeAction));
    bytes32 mint = keccak256(bytes("MINT"));
    bytes32 burn = keccak256(bytes("BURN"));
    bytes32 lock = keccak256(bytes("LOCK"));
    bytes32 release = keccak256(bytes("RELEASE"));

    bool doesAssetExist = false;
    address[2] memory supportedAstralAssets = [address(this), msg.sender];
    for(uint i = 0; i < supportedAstralAssets.length; i++) {
      if(supportedAstralAssets[i] == token) doesAssetExist = true;
      break;
    }
    if (doesAssetExist && BridgeAction == lock) {
      // AstralERC20Logic(token).transferFrom(to, transferContract, amount);
      // lock();
    } else if (doesAssetExist && BridgeAction == release) {
      // transferContract.transferBackToBridge(address(this), amount);
      // release();
    } else if (!doesAssetExist && BridgeAction == mint) {
      //  mint(
      //   bytes32 _payloadHash, 
      //   bytes32 _nonceHash, 
      //   bytes memory _sig, 
      //   address to, 
      //   uint amount, 
      //   uint otherChainNonce
      //  );
    }else if (!doesAssetExist && BridgeAction == burn) {
      //  burn(to, amount);
    
    }
    

  }

  function burn(address to, uint _amount) external {
    require(to != address(0), "invalid burn address");
    require(token.balanceOf(msg.sender) >= _amount, "insufficent balance");

    uint256 amountFeeRate = token.exchangeRateCurrent();
    uint256 recipientAmount = _amount - amountFeeRate;

    require(
      (_amount * 10000) / 10000 ==  _amount && 
      _amount > 0, 
      "lock amount must be greater than zero"
    );

    //mint for user
    token.burn(msg.sender, _amount);
    //mint fee for admin
    token.mint(admin, amountFeeRate);

    emit AssetBurnt(msg.sender, _amount - amountFeeRate, block.timestamp, burnReleaseNonce);
    burnReleaseNonce += 1;
  }

  function mint(
    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    uint _amount, 
    uint otherChainNonce,
    address mintAddress
  ) external {
    require(processedLockNonces[otherChainNonce] == false, 'transfer already processed');
    processedLockNonces[otherChainNonce] = true;

    //try do abi.decode payload hash

    bytes32 sigHash = hashForSignature(_payloadHash, _amount, mintAddress, _nonceHash);
    uint256 tokenFeeRate = token.exchangeRateCurrent();

    require(
      verifySignature(sigHash, _sig), 
      "unauthorized mint: signature does not match request"
    );
    require((_amount * 10000) / 10000 == _amount, "amount too low");

    //get the fee for the admin

    uint tokenFee = (_amount * tokenFeeRate) / 10000;
    console.log("token feeeeeeee", tokenFee);
    //mint for user
    token.mint(mintAddress, _amount - tokenFee);
    //mint fee for admin
    token.mint(admin, tokenFee);

    emit MintEvent(
      address(this),
      msg.sender,
      _amount,
      block.timestamp,
      otherChainNonce,
      Step.Mint
    );
  }

  function lock(address regsitryAddress, address lockAsset, uint256 _amount) external {
    TestNativeAssetRegistry registry = TestNativeAssetRegistry(regsitryAddress);
    
    address[] memory assetRegistry = registry.getAllNaitveERC20Asset();
    bool doesAssetExist = false;
    for(uint i = 0; i < assetRegistry.length; i++) {
      if(assetRegistry[i] == lockAsset) doesAssetExist = true;
      break;
    }
    require(doesAssetExist, "lock asset not supported");
    require(_amount > 0, "lock amount must be greater than zero");
    uint256 amountFeeRate = token.exchangeRateCurrent();

    IERC20(lockAsset).transferFrom(msg.sender, address(this), _amount - amountFeeRate);
    lockBalance[msg.sender] += _amount - amountFeeRate;

    emit AssetLocked(msg.sender, _amount - amountFeeRate, block.timestamp, lockMintNonce);
    lockMintNonce+=1;

  }

//on the creation of an astralAsset tie in th address of the associated token
//so we can always know were releasing teh correct token
  function release(    bytes32 _payloadHash, 
    bytes32 _nonceHash, 
    bytes memory _sig, 
    uint _amount,
    address releaseAsset, 
    address recipient,
    uint otherChainNonce,
    address regsitryAddress
  ) external {
    require(processedBurnNonces[otherChainNonce] == false, 'transfer already processed');
    processedBurnNonces[otherChainNonce] = true;

    TestNativeAssetRegistry registry = TestNativeAssetRegistry(regsitryAddress);
    
    address[] memory assetRegistry = registry.getAllNaitveERC20Asset();
    bool doesAssetExist = false;
    for(uint i = 0; i < assetRegistry.length; i++) {
      if(assetRegistry[i] == releaseAsset) doesAssetExist = true;
      break;
    }
    require(doesAssetExist, "lock asset not supported");

    bytes32 sigHash = hashForSignature(_payloadHash, _amount, recipient, _nonceHash);
    uint256 tokenFeeRate = token.exchangeRateCurrent();

    uint tokenFee = (_amount * tokenFeeRate) / 10000;
    require(
      verifySignature(sigHash, _sig), 
      "unauthorized mint: signature does not match request"
    );
    console.log("lock balance is ", lockBalance[recipient], tokenFee, _amount );
    require(
      (_amount * 10000) / 10000 == _amount
      &&  _amount - tokenFee <= lockBalance[recipient], 
      "amount too low");

    //mint for user
    IERC20(releaseAsset).transfer(recipient, _amount - tokenFee);
    IERC20(releaseAsset).transfer(admin, tokenFee);

    emit ReleaseEvent(
      recipient,
      address(this),
      _amount,
      block.timestamp,
      burnReleaseNonce,
      Step.Burn
    );
  }

  function hashForSignature(
        bytes32 _pHash,
        uint256 _amount,
        address _to,
        bytes32 _nHash
    ) public view returns (bytes32) {
        return
            keccak256(abi.encode(_pHash, _amount, address(token), _to, _nHash));
    }

    function verifySignature(bytes32 _sigHash, bytes memory _sig)
		public
		view
    returns (bool) {
       console.log("admin address", admin);
        return admin == ECDSA.recover(_sigHash, _sig);
    }

    function getBalance(address user) public view returns (uint256) {
      return lockBalance[user];
    }

    function checkNonce(uint256 _nonce, string memory _type) external view returns (bool) {
      if (keccak256(bytes(_type)) == keccak256(bytes("Burn"))) {
        return processedBurnNonces[_nonce];
    	} else return processedLockNonces[_nonce];
    }

	//have registry address as global var
	function doesReleaseAssetExist(address regsitryAddress, address _releaseAsset) external view returns (bool) {
		TestNativeAssetRegistry registry = TestNativeAssetRegistry(regsitryAddress);
    
		address[] memory assetRegistry = registry.getAllNaitveERC20Asset();
		bool doesAssetExist = false;
		for(uint i = 0; i < assetRegistry.length; i++) {
		if(assetRegistry[i] == _releaseAsset) doesAssetExist = true;
		break;
		}
		return doesAssetExist;
	}
}