pragma solidity >= 0.8.9;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "../../interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AstralERC20Logic} from "../AstralERC20Asset/AstralERC20.sol";

contract AstralAssetVault is Ownable {

     event AssetLocked(
        address _for,
        uint amount,
        uint256 timestamp
    );
    event AssetReleased(
        address _for,
        uint amount,
        uint256 timestamp
    );

    mapping(address => uint256) lockBalance;

    function lockAsset(address _token, address _for, uint256 _amount) external onlyOwner {
        require(_amount > 0, "lock amount must be greater than zero");
        AstralERC20Logic token = AstralERC20Logic(_token);
        uint256 amountFeeRate = token.exchangeRateCurrent();
        IERC20(_token).transferFrom(_for, address(this), _amount - amountFeeRate);
        lockBalance[_for] += _amount - amountFeeRate;

        emit AssetLocked(_for, _amount - amountFeeRate, block.timestamp);
    }

    function releaseAsset(address _token, address _for, uint256 _amount) external onlyOwner {
        require(_amount > 0, "lock amount must be greater than zero");
        AstralERC20Logic token = AstralERC20Logic(_token);
        uint256 amountFeeRate = token.exchangeRateCurrent();
        require(lockBalance[_for] >= _amount - amountFeeRate);
        IERC20(_token).transfer(_for, _amount - amountFeeRate);
        lockBalance[_for] -= _amount - amountFeeRate;

        emit AssetReleased(_for, _amount - amountFeeRate, block.timestamp);
    }

}

