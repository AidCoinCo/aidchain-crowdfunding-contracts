// SPDX-License-Identifier: MIT

pragma solidity ^0.7.1;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./access/Roles.sol";

contract Project is Roles {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 private _token;

    // beneficiary of tokens after they are released
    address private _beneficiary;

    // timestamp when token release is enabled
    uint256 private _releaseTime;

    constructor (IERC20 token, address beneficiary, uint256 releaseTime) {
        require(address(token) != address(0), "Project: token is the zero address");
        require(beneficiary != address(0), "Project: beneficiary is the zero address");
        require(releaseTime > block.timestamp, "Project: release time is before current time"); // solhint-disable-line not-rely-on-time

        _token = token;
        _beneficiary = beneficiary;
        _releaseTime = releaseTime;
    }

    /**
     * @return the token being held.
     */
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @return the beneficiary of the tokens.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @return the time when the tokens are released.
     */
    function releaseTime() public view returns (uint256) {
        return _releaseTime;
    }

    /**
     * @notice Transfers tokens held by contract to beneficiary.
     */
    function release() public onlyOperator {
        // solhint-disable-next-line not-rely-on-time
        require(block.timestamp >= _releaseTime, "Project: current time is before release time");

        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0, "Project: no tokens to release");

        _token.safeTransfer(_beneficiary, amount);
    }
}
