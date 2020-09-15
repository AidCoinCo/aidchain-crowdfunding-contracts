// SPDX-License-Identifier: MIT

pragma solidity ^0.7.1;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./access/Roles.sol";

contract Project is Roles, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 private _token;

    // beneficiary of tokens after they are released
    address private _beneficiary;

    // recovery address
    address private _recovery;

    // timestamp when token release is enabled
    uint256 private _releaseTime;

    // defines if funds have been already released or not
    bool private _released = false;

    constructor (
        IERC20 token,
        address beneficiary,
        address recovery,
        uint256 releaseTime
    ) {
        require(address(token) != address(0), "Project: token is the zero address");
        require(beneficiary != address(0), "Project: beneficiary is the zero address");
        require(recovery != address(0), "Project: recovery is the zero address");
        require(releaseTime > block.timestamp, "Project: release time is before current time"); // solhint-disable-line not-rely-on-time

        _token = token;
        _beneficiary = beneficiary;
        _recovery = recovery;
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
     * @return the recovery address.
     */
    function recovery() public view returns (address) {
        return _recovery;
    }

    /**
     * @return the time when the tokens are released.
     */
    function releaseTime() public view returns (uint256) {
        return _releaseTime;
    }

    /**
     * @return the release status.
     */
    function released() public view returns (bool) {
        return _released;
    }

    /**
     * @notice Transfers tokens held by contract to beneficiary.
     */
    function release() public onlyOperator nonReentrant {
        // solhint-disable-next-line not-rely-on-time
        require(block.timestamp >= _releaseTime, "Project: current time is before release time");

        require(_released == false, "Project: already released");

        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0, "Project: no tokens to release");

        _token.safeTransfer(_beneficiary, amount);

        _released = true;
    }
}
