// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProfileRegistry.sol";
import "../src/FeedEngine.sol";

contract PulseTest is Test {
    ProfileRegistry registry;
    FeedEngine engine;

    address alice = address(0x111);
    address bob = address(0x222);

    function setUp() public {
        registry = new ProfileRegistry();
        engine = new FeedEngine(address(registry));
    }

    function testCreateProfile() public {
        vm.prank(alice);
        registry.createProfile("alice_web3");

        (string memory username, uint256 postCount, bool exists) = registry.profiles(alice);
        assertEq(username, "alice_web3");
        assertEq(postCount, 0);
        assertTrue(exists);
    }

    function testPostMessage() public {
        vm.prank(alice);
        registry.createProfile("alice_web3");

        vm.prank(alice);
        engine.postMessage("Hello Monad!");

        (address author, string memory content, uint256 likeCount, uint256 timestamp, bool exists) = engine.posts(alice, 1);
        
        assertEq(author, alice);
        assertEq(content, "Hello Monad!");
        assertEq(likeCount, 0);
        assertTrue(timestamp > 0);
        assertTrue(exists);
        
        // Post count on registry should be 1
        (, uint256 pc, ) = registry.profiles(alice);
        assertEq(pc, 1);
    }

    function testLikeAndFollow() public {
        vm.prank(alice);
        registry.createProfile("alice");

        vm.prank(bob);
        registry.createProfile("bob");

        vm.prank(alice);
        engine.postMessage("Great parallel execution");

        vm.prank(bob);
        engine.likePost(alice, 1);

        (,, uint256 lc,,) = engine.posts(alice, 1);
        assertEq(lc, 1);

        vm.prank(bob);
        registry.follow(alice);

        assertTrue(registry.isFollowing(bob, alice));
    }
}
