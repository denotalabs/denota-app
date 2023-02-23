// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";

contract RegistrarFees is Ownable {
    using SafeERC20 for IERC20;
    mapping(address => mapping(address => uint256))
        internal _moduleTokenRevenue;
    mapping(address => uint256) internal _tokenReserve;
    uint256 public _writeFlatFee; // Question can use a smaller data type?
    uint256 public _writeBPSFee;
    uint256 public _transferBPSFee; // BPS fee taken from cheq.amount
    uint256 public _fundFlatFee;
    uint256 public _fundBPSFee; // Question: should all fees except transfer have BPS?
    uint256 public _cashFlatFee;
    uint256 public _cashBPSFee;

    function updateFees(
        uint256 writeFlatFee_,
        uint256 transferBPSFee_,
        uint256 fundFlatFee_,
        uint256 cashFlatFee_
    ) external onlyOwner {
        _writeFlatFee = writeFlatFee_;
        _transferBPSFee = transferBPSFee_;
        _fundFlatFee = fundFlatFee_;
        _cashFlatFee = cashFlatFee_;
    }

    function moduleWithdraw(
        address token,
        uint256 amount,
        address payoutAccount
    ) external {
        require(
            _moduleTokenRevenue[_msgSender()][token] >= amount,
            "INSUF_FUNDS"
        );
        unchecked {
            _moduleTokenRevenue[_msgSender()][token] -= amount;
        }
        IERC20(token).safeTransferFrom(address(this), payoutAccount, amount);
    }

    function getFees()
        internal
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            _writeFlatFee,
            _writeBPSFee,
            _transferBPSFee,
            _fundFlatFee,
            _fundBPSFee,
            _cashFlatFee
        );
    }
}
