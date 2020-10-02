// SPDX-License-Identifier: MIT

pragma solidity ^0.7.2;

import "../access/Roles.sol";

contract RolesMock is Roles {

    function setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) public {
        _setRoleAdmin(roleId, adminRoleId);
    }

    function onlyOPERATORMock() public view onlyOperator {} // solhint-disable-line no-empty-blocks
}
