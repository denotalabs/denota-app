// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";

// MUMBAI
// AAVE: 0x2a58E9bbb5434FdA7FF78051a4B82cb0EF669C17
// TestDAI: 0x982723cb1272271b5ee405A5F14E9556032d9308
// TestWETH: 0x612f8B2878Fc8DFB6747bc635b8B3DeDFDaeb39e
// DAI: 0x9A753f0F7886C9fbF63cF59D0D4423C5eFaCE95B
// WETH: 0xd575d4047f8c667E064a4ad433D04E25187F40BB

/*
Pay fees on:
    Transfer- from owner to protocol (flat fee) [from cheque.amount] ✅
    WriteCheque- from drawer to auditor (flat and/or percent) [from cheque.amount | auditor-chosen ERC20 w .transferFrom() | ]
    Void- from drawer|recipient to auditor (flat and/or percent) [from cheque.amount | auditor-chosen ERC20 w .transferFrom()]
    Off-chain- from drawer|recipient to auditor (flat and/or percentage or cheqBook for off-chain pricing)
    Native fees- from user to protocol|auditor
        Easiest to price for user but
Pay fees with:
    subtract from cheque.amount
    transfer ERC20 from paying party
    transfer gwei from paying party
    subtract deposit balance from paying party

Don't want dangling debt if we can help it- if unavoidable, revoke handshake of debting party?
 */

contract Cheq is ERC721, Ownable {
    enum Status{Pending, Cashed, Voided}

    struct Cheque {
        uint256 amount;
        uint256 created;
        uint256 expiry;
        IERC20 token;
        address drawer;
        address recipient;
        address auditor;
        Status status;
        // bool collateralized;
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(address => mapping(address => bool)) public userAuditor; // Whether User accepts Auditor
    mapping(address => mapping(address => bool)) public auditorUser; // Whether Auditor accepts User
    mapping(address => uint256) public auditorFlatFee; // Auditor's writing fee
    // mapping(address => mapping(uint256 => bool)) public auditorDurations; // Auditor voiding periods
    mapping(address => mapping(address => uint256))
        public acceptedAuditorTimestamp;

    mapping(uint256 => Cheque) public chequeInfo; // Cheque information
    mapping(address => mapping(IERC20 => uint256)) public deposits; // Total user deposits
    uint256 public totalSupply; // Total cheques created

    // mapping(IERC20 => bool) public tokenWhitelist;  // Allowed tokens (not all tokens have yield)
    mapping(IERC20 => uint256) public protocolFee; // Fee in ERC20 token taken from each cheque transfer
    mapping(IERC20 => uint256) public protocolReserve; // Token balances not needed for cheque collateralization
    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposit(IERC20 indexed _token, address indexed to, uint256 amount);
    event WriteCheque(uint256 indexed tokenId, uint256 amount, uint256 expiry, IERC20 token, address drawer, address indexed recipient, address indexed auditor); 
    event Cash(address indexed bearer, uint256 indexed tokenId);
    event Void(address indexed bearer, uint256 indexed tokenId);
    event ShakeAuditor(address indexed user, address indexed auditor, bool accepted);
    event ShakeUser(address indexed auditor, address indexed user, bool accepted);

    event SetProtocolFee(IERC20 _token, uint256 amount);
    event Withdraw(address indexed _address, uint256 amount);

    modifier UserAuditorUserHandshake(
        address auditor,
        uint256 duration,
        address recipient
    ) {
        if (auditor!=_msgSender()){
            require(userAuditor[_msgSender()][auditor], "AUDITOR_UNAUTH");  // You haven't requested this auditor
            require(auditorUser[auditor][_msgSender()], "UNAPP_AUDITOR");  // auditor hasn't approved you
            require(
                auditorUser[auditor][recipient],
                "AUDITOR:UNAUTH_RECIPIENT"
            );
            // require(auditorDurations[auditor][duration], "Duration not allowed");
            require(
                userAuditor[recipient][auditor],
                "RECIPIENT:UNAUTH_AUDITOR"
            );
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CheqProtocol", "CHEQ") {}

    function selfDestruct() external onlyOwner {
        this.selfDestruct();
    }

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
        require(_token.transferFrom(
            _msgSender(),
            address(this),
            _amount
        ), "Transfer failed");
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
        _feeOnTransfer(chequeID);  // TODO switch with yield
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
        _feeOnTransfer(chequeID);  // TODO switch with yield
        _safeTransfer(from, to, chequeID, data);
    }

    /*//////////////////////////////////////////////////////////////
                        ERC-721 FUNCTION USAGE
    //////////////////////////////////////////////////////////////*/
    function _initCheque(IERC20 _token,
        uint256 amount,
        uint256 duration,
        address auditor,
        address recipient) private view returns(Cheque memory){
        return Cheque({
            drawer: _msgSender(),
            recipient: recipient,
            created: block.timestamp,
            expiry: block.timestamp + duration,
            auditor: auditor,
            token: _token,
            amount: amount,
            status: Status.Pending
        });
    }

    function writeCheque(
        IERC20 _token,
        uint256 amount,
        uint256 duration,
        address auditor,
        address recipient
    )
        public
        UserAuditorUserHandshake(auditor, duration, recipient)
        returns (uint256)
    {
        require(
            amount <= deposits[_msgSender()][_token],
            "INSUF_BAL"
        );
        // uint256 fee = auditorFlatFee[auditor];
        // require(msg.value >= fee, "AUD_FEE");
        // (bool sent, ) = auditor.call({value: fee})("");
        // require(sent, "FEE_FAIL");
        deposits[_msgSender()][_token] -= amount;
        chequeInfo[totalSupply] = _initCheque(_token, amount, duration, auditor, recipient);
        emit WriteCheque(totalSupply, amount, block.timestamp + duration, _token, _msgSender(), recipient, auditor);  // chequeInfo[chequeId]
        _safeMint(recipient, totalSupply);
        totalSupply += 1;
        return totalSupply-1;
    }

    function cashCheque(uint256 chequeID) external {
        Cheque storage cheque = chequeInfo[chequeID];
        require(_isApprovedOrOwner(_msgSender(), chequeID), "Non-owner");
        require(block.timestamp >= cheque.expiry, "Premature");
        require(cheque.status == Status.Pending, "Non-cashable");
        cheque.status = Status.Cashed;
        require(cheque.token.transfer(ownerOf(chequeID), cheque.amount), "Transfer failed.");
        emit Cash(_msgSender(), chequeID);
    }

    function _voidCheque(
        Cheque storage cheque,
        uint256 chequeID,
        address depositTo
    ) private {
        require(cheque.auditor == _msgSender(), "Not auditor");
        require(cheque.expiry >= block.timestamp, "Cheque matured");
        cheque.status = Status.Voided;
        // uint256 fee = auditorVoidFee[_msgSender()];
        deposits[depositTo][cheque.token] += cheque.amount;// - fee; // Add balance back to drawer
        emit Void(ownerOf(chequeID), chequeID);
    }

    function voidCheque(uint256 chequeID) external {
        Cheque storage cheque = chequeInfo[chequeID];
        _voidCheque(cheque, chequeID, cheque.drawer);
    }

    /*//////////////////////////////////////////////////////////////
                          AUDITOR FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function acceptAuditor(address auditor, bool accept) external returns (bool) {
        userAuditor[_msgSender()][auditor] = accept;
        acceptedAuditorTimestamp[_msgSender()][auditor] = block.timestamp;
        emit ShakeAuditor(_msgSender(), auditor, accept);
        return true;
    }

    function acceptUser(address drawer, bool accept) external returns (bool) {
        auditorUser[_msgSender()][drawer] = accept;
        emit ShakeUser(_msgSender(), drawer, accept);
        return true;
    }

    // function setAllowedDuration(uint256 duration) external {
    //     // Auditor will set this
    //     auditorDurations[_msgSender()][duration] = true;
    // }

    function depositWrite(
        IERC20 _token,
        uint256 amount,
        uint256 duration,
        address auditor,
        address recipient) external
        returns (uint256){
        require(deposit(_token, amount), "deposit failed");
        return writeCheque(_token, amount, duration, auditor, recipient);
    }
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
}
