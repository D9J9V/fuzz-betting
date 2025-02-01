// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract FuzzBetting is Ownable {
    IERC20 public token;

    address public agentA;
    address public agentB;

    uint256 public totalAgentA;
    uint256 public totalAgentB;
    uint256 public currentGameId;
    uint256 public minBetAmount = 1;
    uint256 public promptCounter;

    bool public gameEnded;

    struct Prompt {
        bool isAgentA;
        uint256 votes;
        bool exists;
        address creator;
        uint256 gameId;
    }

    mapping(uint256 => mapping(address => uint256)) public userToAgentAByGame;
    mapping(uint256 => mapping(address => uint256)) public userToAgentBByGame;
    mapping(address => bool) public admins;
    mapping(uint256 => Prompt) public prompts;
    mapping(uint256 => uint256[]) public gamePrompts;

    event PromptBet(address indexed user, bool isAgentA, uint256 amount, uint256 promptId, uint256 gameId);
    event SimpleBet(address indexed user, bool isAgentA, uint256 amount, uint256 gameId);
    event PromptVote(address indexed user, uint256 promptId, uint256 amount, uint256 gameId);
    event GameEnded(address winner, uint256 totalAmount, uint256 gameId);
    event AdminAdded(address admin);
    event AdminRemoved(address admin);
    event GameReset(uint256 newGameId);
    event MinBetAmountUpdated(uint256 newAmount);

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(),"not Authorized");
        _;
    }

    constructor(address _tokenAddress, address _agentA, address _agentB) Ownable() {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_agentA != address(0) && _agentB != address(0), "Invalid agent address");
        require(_agentA != _agentB, "Agents must be different");

        token = IERC20(_tokenAddress);
        agentA = _agentA;
        agentB = _agentB;
        admins[msg.sender] = true;
        currentGameId = 1;    
    }

    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid admin address");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function setMinBetAmount(uint256 _newAmount) external onlyAdmin {
        require(_newAmount > 0, "Min bet must be greater than 0");
        minBetAmount = _newAmount;
        emit MinBetAmountUpdated(_newAmount);
    }

    function betWithPrompt(bool _isAgentA, uint256 _amount) external returns (uint256) {
        require(!gameEnded, "Game has ended");
        require(_amount >= minBetAmount, "Amount below minimum");

        token.transferFrom(msg.sender, address(this), _amount);

        promptCounter++;
        uint256 promptId = currentGameId * 100000 + promptCounter;

        if(_isAgentA) {
            userToAgentAByGame[currentGameId][msg.sender] += _amount;
            totalAgentA += _amount;
        } else {
            userToAgentBByGame[currentGameId][msg.sender] += _amount;
            totalAgentB += _amount;
        }

        prompts[promptId] = Prompt({
            isAgentA: _isAgentA,
            votes: _amount,
            exists: true,
            creator: msg.sender,
            gameId: currentGameId
        });

        gamePrompts[currentGameId].push(promptId);

        emit PromptBet(msg.sender, _isAgentA, _amount, promptId, currentGameId);
        return promptId;
    }

    function getGamePrompts(uint256 _gameId) external view returns (Prompt[] memory) {
        require(_gameId > 0 && _gameId <= currentGameId, "Invalid gameId");

        uint256[] storage promptIds = gamePrompts[_gameId];
        Prompt[] memory gamePromptList = new Prompt[](promptIds.length);

        for (uint i = 0; i < promptIds.length; i++) {
            gamePromptList[i] = prompts[promptIds[i]];
        }

        return gamePromptList;
    }

    function voteForPrompt(uint256 _promptId, uint256 _amount) external { 
        require(!gameEnded, "Game has ended");
        require(_amount >= minBetAmount, "Amount below minimum");
        require(prompts[_promptId].exists, "Prompt does not exist");
        require(prompts[_promptId].gameId == currentGameId, "Prompt from different game");

        token.transferFrom(msg.sender, address(this), _amount);

        Prompt storage prompt = prompts[_promptId];
        if(prompt.isAgentA) {
            userToAgentAByGame[currentGameId][msg.sender] += _amount;
            totalAgentA += _amount;
        } else { 
            userToAgentBByGame[currentGameId][msg.sender] += _amount;
            totalAgentB += _amount;
        }
        prompt.votes += _amount;

        emit PromptVote(msg.sender, _promptId, _amount, currentGameId);
    }

    function betOnAgent(bool _isAgentA, uint256 _amount) external {
        require(!gameEnded, "Game has ended");
        require(_amount >= minBetAmount, "Amount below minimum");

        token.transferFrom(msg.sender, address(this), _amount);

        if(_isAgentA) {
            userToAgentAByGame[currentGameId][msg.sender] += _amount;
            totalAgentA += _amount;
        } else {
            userToAgentBByGame[currentGameId][msg.sender] += _amount;
            totalAgentB += _amount;
        }

        emit SimpleBet(msg.sender, _isAgentA, _amount, currentGameId);
    }

    function getPrompt(uint256 _promptId) external view returns (Prompt memory) {
        require(prompts[_promptId].exists, "Prompt doesn't exist");
        return prompts[_promptId];
    }

    function getCurrentGamePrompts() external view returns (Prompt[] memory) {
        uint256[] storage promptIds = gamePrompts[currentGameId];
        Prompt[] memory gamePromptList = new Prompt[](promptIds.length);

        for (uint i=0; i< promptIds.length; i++) {
            gamePromptList[i] = prompts[promptIds[i]];
        }
        return gamePromptList;
    }

    function getTotalAcumulated() public view returns (uint256) {
        return totalAgentA + totalAgentB;
    }

    function getUserContribution(address _user,uint256 _gameId) external view returns (uint256 forA, uint256 forB) {
        return (userToAgentAByGame[_gameId][_user], userToAgentBByGame[_gameId][_user]);
    }

    function endGame(bool _isAgentAWinner) external onlyAdmin {
        require(!gameEnded, "Game has ended");
        require(getTotalAcumulated() > 0, "No tokens to distribute");

        address winner = _isAgentAWinner ? agentA : agentB;
        uint256 totalAmount = getTotalAcumulated();

        gameEnded = true;

        require(token.transfer(winner, totalAmount), "Transfer Failed");

        emit GameEnded(winner, totalAmount, currentGameId);
    }

    function resetGame() external onlyAdmin {
        require(gameEnded, "Current game not ended");
        gameEnded = false;
        totalAgentA = 0;
        totalAgentB = 0;
        promptCounter = 0;
        currentGameId++;

        emit GameReset(currentGameId);
    }
}
