// SPDX-License-Identifier: MIT

pragma solidity ^0.7.1;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Project is Ownable {
    event WorkDone(uint256 value);

    address private _creator;

    modifier onlyCreator() {
        require(_msgSender() == _creator, "Project: Caller is not the creator");
        _;
    }

    constructor() {
        _creator = owner();
    }

    function creator() public view returns (address) {
        return _creator;
    }

    function creatorDoesWork(uint256 value) public onlyCreator {
        emit WorkDone(value);
    }

    function ownerDoesWork(uint256 value) public onlyOwner {
        emit WorkDone(value);
    }
}
