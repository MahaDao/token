pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IAccessControl.sol";

/**
 * @dev Timelocks minting tokens for the MahaToken.
 */
contract Timelock is Ownable {
    /**
     * State variables.
     */

    IAccessControl public token;
    uint256 public unlockTimestamp;
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * Event.
     */
    event Unlocked(uint256 time, address unlocker);

    /**
     * Modifier
     */
    modifier canRestorAdmin {
        require(
            block.timestamp >= unlockTimestamp,
            "Timelock: early minting not allowed"
        );
        _;
    }

    /**
     * Constructor.
     */
    constructor(IAccessControl token_, uint256 unlockTimestamp_) public {
        token = token_;
        unlockTimestamp = unlockTimestamp_;
    }

    /**
     * Mutations.
     */

    // function revokeAdminRole(address who) public onlyOwner {
    //     token.revokeRole(MINTER_ROLE, who);
    //     token.revokeRole(DEFAULT_ADMIN_ROLE, who);
    // }

    function setAdminRole() public onlyOwner canRestorAdmin {
        token.grantRole(DEFAULT_ADMIN_ROLE, owner());

        emit Unlocked(block.timestamp, msg.sender);
    }
}
