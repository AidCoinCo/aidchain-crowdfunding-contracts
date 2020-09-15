// SPDX-License-Identifier: MIT

pragma solidity ^0.7.1;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./access/Roles.sol";

contract Project is Roles, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // ERC20 basic token contract being held
    IERC20 private _token;

    // beneficiary of tokens after they are released
    address private _beneficiary;

    // recovery address
    address private _recovery;

    // timestamp when token release is enabled
    uint256 private _releaseTime;

    // percent of funds to be released first
    uint256 private _releasePercent;

    // defines if funds have been already released or not
    bool private _released = false;

    constructor (
        IERC20 token,
        address beneficiary,
        address recovery,
        uint256 releaseTime,
        uint256 releasePercent
    ) {
        require(address(token) != address(0), "Project: token is the zero address");
        require(beneficiary != address(0), "Project: beneficiary is the zero address");
        require(recovery != address(0), "Project: recovery is the zero address");
        require(releaseTime > block.timestamp, "Project: release time is before current time"); // solhint-disable-line not-rely-on-time
        require(releasePercent <= 100, "Project: release percent is more than 100");

        _token = token;
        _beneficiary = beneficiary;
        _recovery = recovery;
        _releaseTime = releaseTime;
        _releasePercent = releasePercent;
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
        require(block.timestamp >= _releaseTime, "Project: current time is before release time"); // solhint-disable-line not-rely-on-time
        require(_released == false, "Project: already released");

        uint256 amount = _token.balanceOf(address(this)).mul(_releasePercent).div(100);
        require(amount > 0, "Project: no tokens to release");

        _token.safeTransfer(_beneficiary, amount);

        _released = true;
    }

    /**
     * @notice Unlock tokens held by contract to beneficiary.
     */
    function unlock() public onlyOperator nonReentrant {
        require(_released == true, "Project: not already released");

        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0, "Project: no tokens to unlock");

        _token.safeTransfer(_beneficiary, amount);
    }

    /**
     * @notice Recover tokens held by contract to recovery.
     * @param tokenAddress The token contract address
     */
    function recover(IERC20 tokenAddress) public onlyOperator nonReentrant {
        require(_released == true, "Project: not already released");

        uint256 amount = tokenAddress.balanceOf(address(this));
        require(amount > 0, "Project: no tokens to recover");

        tokenAddress.safeTransfer(_recovery, amount);
    }
}
