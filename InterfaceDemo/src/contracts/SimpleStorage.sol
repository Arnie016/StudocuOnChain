// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedData;

    event ValueStored(uint256 newValue, address indexed sender);

    function set(uint256 x) external {
        storedData = x;
        emit ValueStored(x, msg.sender);
    }

    function get() external view returns (uint256) {
        return storedData;
    }
}
