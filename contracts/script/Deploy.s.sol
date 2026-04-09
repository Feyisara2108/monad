// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ProfileRegistry.sol";
import "../src/FeedEngine.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ProfileRegistry registry = new ProfileRegistry();
        FeedEngine engine = new FeedEngine(address(registry));

        vm.stopBroadcast();
    }
}
