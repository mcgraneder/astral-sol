pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {AstralAssetVault} from "./AstralAssetValut.sol";
//right now transfer and transfer from can be called by anyone
//in futrue disable thi so that both can only be called by the assets gateway contract

//to do set up UUPS pattern and acces coontrol with Roles

///AstralRC20 represents a digital asset that has been bridged on to
/// the Ethereum ledger. It exposes mint and burn functions that can only be
/// called by it's associated Gateway contract.
contract AstralERC20Logic is ERC20, Ownable {
    using SafeMath for uint256;

    uint8 internal setDecimals;
    uint256 public constant _rateScale = 1e18;
    uint256 internal _rate;
    uint256 public chainId;
    address parentAsset;
    AstralAssetVault tokenVault;

    event LogRateChanged(uint256 indexed _rate);

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint8 _decimals, 
        uint256 _chainId,
        uint256 rate,
        address _parentAsset
    ) public ERC20(_name, _symbol){
         //do more checks here to make sure source asset is legit
        //address checks
        require(rate > 0, "rate must be greater than 0");
        chainId = _chainId;
        parentAsset = _parentAsset;
        _rate = rate;
        if(_decimals != 0) setDecimals = _decimals;
        else setDecimals = 18;

        // tokenVault = new AstralAssetVault();
    }

    function chain() public view returns (uint256) {
        return chainId;
    }

    function getTokenValut() public view returns (AstralAssetVault) {
        return tokenVault;
    }

    function decimals() public view override returns (uint8) {
        return setDecimals;
    }
    /// @notice mint can only be called by the tokens' associated Gateway
    /// contract. See Gateway's mint function instead.
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    /// @notice burn can only be called by the tokens' associated Gateway
    /// contract. See Gateway's burn functions instead.
    function burn(address _from, uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        // Disallow sending tokens to the ERC20 contract address - a common
        // mistake caused by the Ethereum transaction's `to` needing to be
        // the token's address.
        require(
            recipient != address(this),
            "RenERC20: can't transfer to token address"
        );
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        // Disallow sending tokens to the ERC20 contract address (see comment
        // in `transfer`).
        require(
            recipient != address(this),
            "AstralERC20: can't transfer to token address"
        );
        return super.transferFrom(sender, recipient, amount);
    }

    /////////////RATE FUNCTIONS FOR BRIDGE ASSET FEE/////////////////////

        function setExchangeRate(uint256 _nextRate) public onlyOwner {
        _setRate(_nextRate);
    }

    function exchangeRateCurrent() public view returns (uint256) {
        require(_rate != 0, "ERC20WithRate: rate has not been initialized");
        return _rate;
    }

    function _setRate(uint256 _nextRate) internal {
        require(_nextRate > 0, "ERC20WithRate: rate must be greater than zero");
        _rate = _nextRate;
    }

    function balanceOfUnderlying(address _account)
        public
        view
        returns (uint256)
    {
        return toUnderlying(balanceOf(_account));
    }

    function toUnderlying(uint256 _amount) public view returns (uint256) {
        return _amount.mul(_rate).div(_rateScale);
    }

    function fromUnderlying(uint256 _amountUnderlying)
        public
        view
        returns (uint256)
    {
        return _amountUnderlying.mul(_rateScale).div(_rate);
    }

}