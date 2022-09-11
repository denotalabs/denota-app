// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";

contract Cheq is ERC721, Ownable {
    struct Cheque {
        uint256 amount;
        uint256 created;
        uint256 expiry;
        uint256 itemId;
        IERC20 token;
        address drawer;
        address recipient;
        address auditor;
        // bool collateralized;
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(address => mapping(address => bool)) public userAuditor; // Whether User accepts Auditor
    mapping(address => mapping(address => bool)) public auditorUser; // Whether Auditor accepts User
    mapping(address => mapping(uint256 => bool)) public auditorDurations; // Auditor voiding periods
    mapping(address => mapping(address => uint256))
        public acceptedAuditorTimestamp;
    mapping(address => address[]) public acceptedUserAuditors; // Auditor addresses that user accepts
    mapping(address => address[]) public acceptedAuditorUsers; // User addresses that auditor accepts

    mapping(address => address) public trustedAccount; // User's trusted account
    mapping(address => uint256) public lastTrustedChange; // Last time user updated trusted account
    uint256 public trustedAccountCooldown = 180 days; // Cooldown before user can change trusted account again

    mapping(uint256 => Cheque) public chequeInfo; // Cheque information
    mapping(address => mapping(IERC20 => uint256)) public deposits; // Total user deposits
    uint256 private totalSupply; // Total cheques created

    mapping(IERC20 => uint256) public protocolFee; // Fee in ERC20 token taken from each cheque transfer
    mapping(IERC20 => uint256) public protocolReserve; // Token balances not needed for cheque collateralization
    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposit(IERC20 indexed _token, address indexed to, uint256 amount);
    event Cash(address indexed bearer, uint256 indexed tokenId);
    event Void(
        address indexed drawer,
        address indexed auditor,
        uint256 indexed tokenId
    );
    event DirectTransfer(
        IERC20 indexed _token,
        address indexed to,
        uint256 _amount
    );

    event AcceptAuditor(address indexed user, address indexed auditor);
    event AcceptUser(address indexed auditor, address indexed user);

    event SetProtocolFee(IERC20 _token, uint256 amount);
    event Withdraw(address indexed _address, uint256 amount);

    modifier UserAuditorUserHandshake(
        IERC20 _token,
        uint256 amount,
        address auditor,
        uint256 duration,
        address recipient
    ) {
        require(userAuditor[_msgSender()][auditor], "Unapproved auditor");
        require(auditorUser[auditor][_msgSender()], "Auditor must approve you");
        require(
            auditorUser[auditor][recipient],
            "Auditor must approve recipient"
        );
        require(
            userAuditor[recipient][auditor],
            "Recipient must approve auditor"
        );
        require(auditorDurations[auditor][duration], "Duration not allowed");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("dCheque", "dCHQ") {}

    function setProtocolFee(IERC20 _token, uint256 _protocolFee)
        external
        onlyOwner
    {
        protocolFee[_token] = _protocolFee;
        emit SetProtocolFee(_token, _protocolFee);
    }

    function withdraw(IERC20 _token, uint256 _amount) external onlyOwner {
        require(protocolReserve[_token] >= _amount, "More than available");
        unchecked {
            protocolReserve[_token] -= _amount;
        }
        bool success = _token.transferFrom(
            address(this),
            _msgSender(),
            _amount
        );
        require(success, "Transfer failed.");
        emit Withdraw(_msgSender(), _amount);
    }

    /*//////////////////////////////////////////////////////////////
                            USER DEPOSITS
    //////////////////////////////////////////////////////////////*/
    function _deposit(
        IERC20 _token,
        address _address,
        uint256 _amount
    ) private {
        require(_amount > 0, "Zero deposit");
        bool success = _token.transferFrom(
            _msgSender(),
            address(this),
            _amount
        );
        require(success, "Transfer failed");
        deposits[_address][_token] += _amount;
        emit Deposit(_token, _address, _amount);
    }

    function deposit(IERC20 _token, uint256 _amount) public returns (bool) {  // make one external and use other in depositWrite()?
        _deposit(_token, _msgSender(), _amount);
        return true;
    }

    function deposit(
        IERC20 _token,
        uint256 _amount,
        address _address
    ) public returns (bool) {
        _deposit(_token, _address, _amount);
        return true;
    }

    function directTransfer(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external {
        uint256 fromBalance = deposits[_msgSender()][_token];
        require(_amount <= fromBalance, "transfer amount exceeds balance");
        unchecked {
            deposits[_msgSender()][_token] = fromBalance - _amount;
        }
        deposits[_to][_token] += _amount;
        emit DirectTransfer(_token, _to, _amount);
    }

    /*//////////////////////////////////////////////////////////////
                          ERC-721 OVERRIDES
    //////////////////////////////////////////////////////////////*/
    function _feeOnTransfer(uint256 chequeID) private {
        Cheque storage cheque = chequeInfo[chequeID];
        IERC20 _token = cheque.token;
        require(cheque.amount >= protocolFee[_token], "too small for transfer");
        unchecked {
            cheque.amount = cheque.amount - protocolFee[_token];
        }
        protocolReserve[_token] += protocolFee[_token];
    }

    function transferFrom(
        address from,
        address to,
        uint256 chequeID
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), chequeID),
            "Transfer disallowed"
        );
        _feeOnTransfer(chequeID);
        _transfer(from, to, chequeID);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 chequeID,
        bytes memory data
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), chequeID),
            "Transfer disallowed"
        );
        _feeOnTransfer(chequeID);
        _safeTransfer(from, to, chequeID, data);
    }

    /*//////////////////////////////////////////////////////////////
                        ERC-721 FUNCTION USAGE
    //////////////////////////////////////////////////////////////*/
    function writeCheque(
        uint256 itemId,
        IERC20 _token,
        uint256 amount,
        uint256 duration,
        address auditor,
        address recipient
    )
        public
        UserAuditorUserHandshake(_token, amount, auditor, duration, recipient)
        returns (uint256)
    {
        require(
            amount <= deposits[_msgSender()][_token],
            "Insufficient balance"
        );
        require(
            block.timestamp >=
                acceptedAuditorTimestamp[_msgSender()][auditor] + 24 hours,
            "New Auditor cooldown"
        );
        deposits[_msgSender()][_token] -= amount;
        _safeMint(recipient, totalSupply);
        chequeInfo[totalSupply] = Cheque({
            itemId: itemId,
            drawer: _msgSender(),
            recipient: recipient,
            created: block.timestamp,
            expiry: block.timestamp + duration,
            auditor: auditor,
            token: _token,
            amount: amount
        });
        totalSupply += 1;
        return totalSupply - 1; // NOT IDEAL
    }

    function cashCheque(uint256 chequeID) external {
        Cheque storage cheque = chequeInfo[chequeID];
        require(_isApprovedOrOwner(_msgSender(), chequeID), "Non-owner");
        require(block.timestamp >= cheque.expiry, "Premature");
        bool success = cheque.token.transfer(_msgSender(), cheque.amount);
        require(success, "Transfer failed.");
        _burn(chequeID);
        emit Cash(_msgSender(), chequeID);
    }

    function _voidCheque(
        Cheque memory cheque,
        uint256 chequeID,
        address depositTo
    ) private {
        require(cheque.auditor == _msgSender(), "Not auditor");
        require(cheque.expiry >= block.timestamp, "Cheque matured");
        _burn(chequeID);
        deposits[depositTo][cheque.token] += cheque.amount; // Add balance back to drawer
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }

    function voidCheque(uint256 chequeID) external {
        Cheque memory cheque = chequeInfo[chequeID];
        _voidCheque(cheque, chequeID, cheque.drawer);
    }

    function voidRescueCheque(uint256 chequeID) external {
        Cheque memory cheque = chequeInfo[chequeID];
        address fallbackAccount = trustedAccount[cheque.drawer];
        require(fallbackAccount != address(0), "No Fallback");
        _voidCheque(cheque, chequeID, fallbackAccount);
    }

    /*//////////////////////////////////////////////////////////////
                          AUDITOR FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function acceptAuditor(address auditor) external returns (bool) {
        // User will set this
        if (userAuditor[_msgSender()][auditor]) {
            return true;
        }
        userAuditor[_msgSender()][auditor] = true;
        if (auditorUser[auditor][_msgSender()]) {
            acceptedAuditorUsers[auditor].push(_msgSender());
            acceptedUserAuditors[_msgSender()].push(auditor);
        }
        acceptedAuditorTimestamp[_msgSender()][auditor] = block.timestamp;
        emit AcceptAuditor(_msgSender(), auditor);
        return true;
    }

    function acceptUser(address drawer) external returns (bool) {
        // Auditor will set this
        if (auditorUser[_msgSender()][drawer]) {
            return true;
        }
        auditorUser[_msgSender()][drawer] = true;
        if (userAuditor[drawer][_msgSender()]) {
            acceptedUserAuditors[drawer].push(_msgSender());
            acceptedAuditorUsers[_msgSender()].push(drawer);
        }
        emit AcceptUser(_msgSender(), drawer);
        return true;
    }

    function setAllowedDuration(uint256 duration) external {
        // Auditor will set this
        auditorDurations[_msgSender()][duration] = true;
    }

    function getAcceptedUserAuditors(address _address)
        external
        view
        returns (address[] memory)
    {
        return acceptedUserAuditors[_address];
    }

    function getAcceptedAuditorUsers(address _address)
        external
        view
        returns (address[] memory)
    {
        return acceptedAuditorUsers[_address];
    }

    function setTrustedAccount(address account) external {
        // User will set this
        require(
            lastTrustedChange[_msgSender()] == 0 ||
                (block.timestamp >=
                    lastTrustedChange[_msgSender()] + trustedAccountCooldown),
            "Trusted account cooldown"
        );
        trustedAccount[_msgSender()] = account;
        lastTrustedChange[_msgSender()] = block.timestamp;
    }

    function depositWrite(        
        uint256 itemId,
        IERC20 _token,
        uint256 amount,
        uint256 duration,
        address auditor,
        address recipient) external
        returns (uint256){
        require(deposit(_token, amount), "deposit failed");
        return writeCheque(itemId, _token, amount, duration, auditor, recipient);
    }
    /*//////////////////////////////////////////////////////////////
                   CHEQUE READ FUNCTIONS (NECESSARY?)
    //////////////////////////////////////////////////////////////*/
    function chequeAmount(uint256 chequeId) external view returns (uint256) {
        return chequeInfo[chequeId].amount;
    }

    function chequeCreated(uint256 chequeId) external view returns (uint256) {
        return chequeInfo[chequeId].created;
    }

    function chequeExpiry(uint256 chequeId) external view returns (uint256) {
        return chequeInfo[chequeId].expiry;
    }

    function chequeToken(uint256 chequeId) external view returns (IERC20) {
        return chequeInfo[chequeId].token;
    }

    function chequeDrawer(uint256 chequeId) external view returns (address) {
        return chequeInfo[chequeId].drawer;
    }

    function chequeRecipient(uint256 chequeId) external view returns (address) {
        return chequeInfo[chequeId].recipient;
    }

    function chequeAuditor(uint256 chequeId) external view returns (address) {
        return chequeInfo[chequeId].auditor;
    }
    function chequeItemId(uint256 chequeId) external view returns (uint256) {
        return chequeInfo[chequeId].itemId;
    }
}
