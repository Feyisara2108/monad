// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProfileRegistry {
    struct Profile {
        string username;
        uint256 postCount;
        bool exists;
    }

    mapping(address => Profile) public profiles;
    // Follower mapping: isFollowing[follower][followee]
    mapping(address => mapping(address => bool)) public isFollowing;

    event ProfileCreated(address indexed user, string username);
    event Followed(address indexed follower, address indexed followee);
    event Unfollowed(address indexed follower, address indexed followee);

    function createProfile(string calldata _username) external {
        require(!profiles[msg.sender].exists, "Profile already exists");
        require(bytes(_username).length > 0, "Username required");
        require(bytes(_username).length <= 50, "Username too long");

        profiles[msg.sender] = Profile({
            username: _username,
            postCount: 0,
            exists: true
        });

        emit ProfileCreated(msg.sender, _username);
    }

    // Required for the Feed engine to log counts accurately
    function incrementPostCount(address _user) external returns (uint256) {
        require(profiles[_user].exists, "Profile does not exist");
        profiles[_user].postCount++;
        return profiles[_user].postCount;
    }

    function follow(address _user) external {
        require(profiles[_user].exists, "User does not exist");
        require(_user != msg.sender, "Cannot follow yourself");
        require(!isFollowing[msg.sender][_user], "Already following");

        isFollowing[msg.sender][_user] = true;
        emit Followed(msg.sender, _user);
    }

    function unfollow(address _user) external {
        require(isFollowing[msg.sender][_user], "Not following");

        isFollowing[msg.sender][_user] = false;
        emit Unfollowed(msg.sender, _user);
    }
}
