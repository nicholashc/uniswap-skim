// "SPDX-License-Identifier: Unlicence"
pragma solidity 0.7.1;

/// @title Arbitrary Data Forwarder
/// @author @nicholashc
contract Forwarder {

    address internal owner;

    /// @notice set contract deployer as owner
    constructor() {
      owner = msg.sender;
    }

    /// @notice Forward arbitrary data to an arbitrary address
    /// @dev Only the contract deployer is allowed to call this function
    /// @param add the address to forward to
    /// @param data arbitrary data of any length
    /// @return success low level call faiiled or succeeded
    /// @return message any data returned by the call (not necessarily anything)
    function forward(address payable add, bytes calldata data) external payable returns(bool success, bytes memory message) {
        require(msg.sender == owner);
        return add.call{value: msg.value}(data);
    }
}
