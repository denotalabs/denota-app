// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC721/ERC721.sol";
import {Events} from "../contracts/libraries/Events.sol";
import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
import {DataTypes} from "../contracts/libraries/DataTypes.sol";
import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
import {CheqBase64Encoding} from "../contracts/libraries/CheqBase64Encoding.sol";

/** @notice The Inside-out (LensProtocol) design where EOAs call the registrar and registrar calls to PaymentModules (who use RuleModules)
*/
// TODO Use Lens' method for ownership tracking that modifies the ERC721 logic to allow NFTstruct{owner, ...} storage/retrieval
contract CheqRegistrarV2 is ERC721, Ownable, ICheqRegistrar {
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => DataTypes.Cheq) private _cheqInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) private _deposits; // TODO remove deposit and just ensure escrowing?
    mapping(bytes32 => bool) private _bytecodeWhitelist;  // TODO Can this be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    uint256 private _totalSupply; // Total cheqs created
    uint256 public transferFee; // Percent of flat? Is taken from 
    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CheqProtocol", "CHEQ") {
        // writeFlatFee = _writeFlatFee;
        // transferFlatFee = _transferFlatFee;
        // fundFlatFee = _fundFlatFee;
        // cashFlatFee = _cashFlatFee;
        // depositFlatFee = _depositFlatFee;
    }

    function _returnCodeHash(address module) internal returns(bytes32){
        bytes32 moduleCodeHash;
        assembly { moduleCodeHash := extcodehash(module) }
        return moduleCodeHash;
    }

    function whitelistModule(address module, bool bytecodeAccepted, bool addressAccepted) external onlyOwner {  // Whitelist either bytecode or address
        require(bytecodeAccepted != bytecodeAccepted, "CAN'T_ACCEPT_BOTH");
        _bytecodeWhitelist[_returnCodeHash(module)] = bytecodeAccepted;
        _addressWhitelist[module] = addressAccepted;
        emit Events.ModuleWhitelisted(_msgSender(), module, bytecodeAccepted, addressAccepted, block.timestamp);
    }

    function _whitelistedOrCloneable(address module) internal returns(bool) {
        return _addressWhitelist[module] || _bytecodeWhitelist[_returnCodeHash(module)];
    }
    /*//////////////////////////////////////////////////////////////
                              OWNERSHIP
    //////////////////////////////////////////////////////////////*/
    function write(
        DataTypes.Cheq calldata cheq,
        bytes calldata moduleWriteData,  // calldata vs memory
        address owner
    ) external payable returns (uint256) {  // write on someone's behalf by letting module write it for them using money deposited from them
        require(_whitelistedOrCloneable(cheq.module), "MODULE_NOT_WHITELISTED");
        require(cheq.currency.transferFrom(_msgSender(), address(this), cheq.escrowed), "ERC20: TRANFER_FAILED");  // BUG how to limit attack surface from arbitrary external token call?
        // Modules are external too but whitelisted
        require(ICheqModule(cheq.module).processWrite(_msgSender(), owner, _totalSupply, cheq, moduleWriteData), "MODULE: WRITE_FAILED");

        _cheqInfo[_totalSupply] = cheq;
        _cheqInfo[_totalSupply].timeCreated = block.timestamp;  // Not very clean, could be removed, might be redundent with events
        _safeMint(owner, _totalSupply);  // TODO: refactor for LENSPROTOCOL method of tracking ownership

        emit Events.Written(_totalSupply, owner, cheq, moduleWriteData, block.timestamp);
        unchecked { return _totalSupply++; }  // NOTE: Will this ever overflow? Also, returns before increment..?
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory moduleTransferData
    ) public override(ERC721, ICheqRegistrar) {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];  // Better to assign and then index?
        require(ICheqModule(cheq.module).processTransfer(_msgSender(), from, to, tokenId, cheq, moduleTransferData), "MODULE: FAILED");
        uint256 escrowedAmount = _cheqInfo[tokenId].escrowed;
        if (escrowedAmount > 0) 
            _cheqInfo[tokenId].escrowed = escrowedAmount - (escrowedAmount * transferFee) / 10_000;  // Take fee in BPS
        emit Events.Transferred(tokenId, ownerOf(tokenId), to, block.timestamp);
        _safeTransfer(from, to, tokenId, "");
    }

    function approve(address to, uint256 tokenId) public override(ERC721, ICheqRegistrar) { 
        // address owner = ERC721.ownerOf(tokenId);  // Probably allow the the module to do this
        // require(to != owner, "ERC721: approval to current owner");
        // require(
        //     _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
        //     "ERC721: approve caller is not token owner or approved for all"
        // );
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];
        require(ICheqModule(cheq.module).processApproval(_msgSender(), to, tokenId, cheq, ""), "MODULE: FAILED");
        _approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    /*//////////////////////////////////////////////////////////////
                                ESCROW
    //////////////////////////////////////////////////////////////*/
    function fund(  // CheqRegistrar calls erc20 to do transferFrom(). `from` must approve the registrar. How to prevent 3rd parties forcing `from` to fund this if not using from == msg.sender
        uint256 cheqId,
        uint256 amount,
        bytes calldata fundData  //
    ) external payable { // Can take a flat fee here
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];  // Better to assign and then index?
        require(cheq.currency.transferFrom(_msgSender(), address(this), amount), "ERC20: TRANFER_FAILED");  // TODO: safeTransferFrom
        require(ICheqModule(cheq.module).processFund(_msgSender(), amount, cheqId, cheq, fundData), "MODULE: FAILED");  // TODO: send as a struct or individual variables?
        cheq.escrowed += amount;
        emit Events.Funded(_msgSender(), cheqId, fundData, block.timestamp);
    }

    function cash(
        uint256 cheqId,
        uint256 amount,
        address to,
        bytes calldata cashData
    ) external payable {  // Can take a flat fee here
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
        require(cheq.escrowed >= amount, "CANT_CASH_AMOUNT");  // TODO: Need to give the module the cheq's owner
        unchecked { cheq.escrowed -= amount; }
        require(ICheqModule(cheq.module).processCash(_msgSender(), to, amount, cheqId, cheq, cashData), "MODULE: FAILED");  // TODO: send as a struct or individual variables?
        require(cheq.currency.transfer(to, amount), "ERC20: TRANFER_FAILED");  // TODO: safeTransferFrom
        emit Events.Cashed(_msgSender(), to, cheqId, cashData, block.timestamp);
    }
    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function cheqInfo(uint256 cheqId) public view returns (DataTypes.Cheq memory) {
        return _cheqInfo[cheqId];
    }

    function cheqAmount(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].amount;
    }

    function cheqCurrency(uint256 cheqId) public view returns (IERC20) {
        return _cheqInfo[cheqId].currency;
    }

    function cheqDrawer(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].drawer;
    }

    function cheqRecipient(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].recipient;
    }

    function cheqEscrowed(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].escrowed;
    }

    function cheqModule(uint256 cheqId) public view returns (ICheqModule) {
        return ICheqModule(_cheqInfo[cheqId].module);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    { // Question: Should this switch case depend on if module has their own tokenURI()?
        _requireMinted(_tokenId);
        DataTypes.Cheq memory cheq = cheqInfo(_tokenId);
        return CheqBase64Encoding.buildMetadata(
            _tokenId,
            address(cheq.currency),
            cheq.amount,
            cheq.escrowed,
            cheq.drawer,
            cheq.recipient,
            cheq.module
        );
    }
}
/**
struct Invoice {
    uint256 startTime;
    Status workerStatus;
    Status clientStatus;
    Milestone[] milestones;
}
*/
// library AddressGating {  // Each of these libraries should correspond to a certain module type
//     function isAllowed(mapping(address => bool) storage addressBoolMapping, address _address, bool isAllowlist) external returns (bool){
//         if (isAllowlist){
//             return addressBoolMapping[_address];
//         } else {
//             return !addressBoolMapping[_address];
//         }
//     }
// }
// library NFTGating {  // Doesn't use storage slots... Maybe Layout must be compatible w/ Library?
//     function isAllowed(address _NFTContract, address _address, bool isAllowlist) external returns (bool){
//         if (isAllowlist){
//             return IERC721(_NFTContract).balanceOf(_address) > 0;
//         } else {
//             return IERC721(_NFTContract).balanceOf(_address) == 0;
//         }
//     }
// }

    // function _fundable(
    //     uint256 cheqId,
    //     address,
    //     uint256) private returns (uint256) {
    //     if (cheq.cheqEscrowed(cheqId) == 0) {
    //         // Invoice  // && caller == cheqReciever[cheqId]
    //         return cheq.cheqAmount(cheqId);
    //     } else {
    //         // Cheq
    //         return 0;
    //     }
    // }
    // function fundable(
    //     uint256 cheqId,
    //     address,
    //     uint256
    // ) external view returns (uint256) {
    //     return _fundable(cheqId);
    // }

    // // BUG what if funder doesnt fund the invoice for too long??
    // function cashable(
    //     uint256 cheqId,
    //     address caller,
    //     uint256 /* amount */
    // ) public view returns (uint256) {
    //     // Invoice funder can cash before period, cheq writer can cash before period
    //     // Chargeback case
    //     if (
    //         cheqFunder[cheqId] == caller &&
    //         (block.timestamp <
    //             cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])
    //     ) {
    //         // Funding party can rescind before the inspection period elapses
    //         return cheq.cheqEscrowed(cheqId);
    //     } else if (
    //         cheq.ownerOf(cheqId) == caller &&
    //         (block.timestamp >=
    //             cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])
    //     ) {
    //         // Receiving/Owning party can cash after inspection period
    //         return cheq.cheqEscrowed(cheqId);
    //     } else if (isReleased[cheqId]) {
    //         return cheq.cheqEscrowed(cheqId);
    //     } else {
    //         return 0;
    //     }
    // }

    // function cashCheq(uint256 cheqId, uint256 amount) public {
    //     // TODO: allow anyone to cash for someone?
    //     uint256 cashableAmount = cashable(cheqId, _msgSender(), amount);
    //     require(cashableAmount == amount, "Cant cash this amount");
    //     cheq.cash(cheqId, _msgSender(), amount);
    // }

    // function cashCheq(uint256 cheqId) public {
    //     uint256 cashableAmount = cashable(cheqId, _msgSender(), 0);
    //     cashCheq(cheqId, cashableAmount);
    // }

    // function _ownerOf(uint256 tokenId) internal view override returns (address) {
    //     return REGISTRAR.ownerOf(tokenId);
    // }

    // function _transfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal virtual {
    //     require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
    //     require(to != address(0), "ERC721: transfer to the zero address");

    //     _beforeTokenTransfer(from, to, tokenId, 1);

    //     // Check that tokenId was not transferred by `_beforeTokenTransfer` hook
    //     require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");

    //     // Clear approvals from the previous owner
    //     delete _tokenApprovals[tokenId];

    //     unchecked {
    //         // `_balances[from]` cannot overflow for the same reason as described in `_burn`:
    //         // `from`'s balance is the number of token held, which is at least one before the current
    //         // transfer.
    //         // `_balances[to]` could overflow in the conditions described in `_mint`. That would require
    //         // all 2**256 token ids to be minted, which in practice is impossible.
    //         _balances[from] -= 1;
    //         _balances[to] += 1;
    //     }
    //     _owners[tokenId] = to;

    //     emit Transfer(from, to, tokenId);

    //     _afterTokenTransfer(from, to, tokenId, 1);
    // }


    // function tokenURI(uint256 tokenId)
    //     public
    //     view
    //     returns (string memory)
    // { // override(ERC721, ICheqModule)
    //     return string(abi.encodePacked(baseURI, tokenId));
    // }

    /** 
    Status(
        0: neither have started, 
        1: freelancer ready to start, 
        2: client ready for work to start, 
        3: work has started, 
        4: freelancer stopped,
        5: client stopped,
        6: both stopped,
        7: freelancer finished
        8: work completed and paid (freelancer finished and client has paid)
        )
    // enum Status {
    //     BothWaiting,
    //     FreelancerReady,
    //     ClientReady,
    //     BothReady,
    //     FreelancerDisputing,
    //     ClientDisputing,
    //     BothDisputing,
    //     Completed
    // }
     */