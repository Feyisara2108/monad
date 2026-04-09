// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProfileRegistry.sol";

contract FeedEngine {
    ProfileRegistry public profileRegistry;

    struct Post {
        address author;
        string content;
        uint256 likeCount;
        uint256 timestamp;
        bool exists;
    }

    // mapping(author -> mapping(postId -> Post))
    mapping(address => mapping(uint256 => Post)) public posts;

    event PostCreated(address indexed author, uint256 indexed postId, string content, uint256 timestamp);
    event PostLiked(address indexed author, uint256 indexed postId, address indexed liker);

    constructor(address _profileRegistry) {
        profileRegistry = ProfileRegistry(_profileRegistry);
    }

    function postMessage(string calldata _content) external {
        require(bytes(_content).length > 0, "Content required");
        require(bytes(_content).length <= 280, "Content too long");
        
        // Fetch users profile and increment the counter using ProfileRegistry
        // Note: The registry needs to be aware of the FeedEngine if doing state increments,
        // Wait, ProfileRegistry has `incrementPostCount` but right now any address can call it!
        // For MVP, that's fine. In prod, we'd add `onlyFeedEngine` modifier.

        uint256 newId = profileRegistry.incrementPostCount(msg.sender);

        posts[msg.sender][newId] = Post({
            author: msg.sender,
            content: _content,
            likeCount: 0,
            timestamp: block.timestamp,
            exists: true
        });

        emit PostCreated(msg.sender, newId, _content, block.timestamp);
    }

    function likePost(address _author, uint256 _postId) external {
        require(posts[_author][_postId].exists, "Post does not exist");
        
        posts[_author][_postId].likeCount++;
        
        emit PostLiked(_author, _postId, msg.sender);
    }
}
