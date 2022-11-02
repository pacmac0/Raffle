// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

// imports
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

/* errors */
error Raffle__sendExactEntryPrice();
error Raffle__TransferFailed();
error Raffle__UpkeepNotNeeded(uint256 raffleState, uint256 numPlayers, uint256 potBalance);
error Raffle__RaffleNotOpen();

/**@title A sample Raffle Contract
 * @author Fynn
 * @notice This contract is for creating a sample raffle contract
 * @dev This implements the Chainlink VRF Version 2 and Chainlink Keepers
 */
contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
	/* type declarations */
	enum RaffleState {
		OPEN,
		DRAWING
	}

	/* state variables (constant, private and immutable are more gas efficient) */
	// Chainlink VRF Variables
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	uint64 private immutable i_subscriptionId;
	bytes32 private immutable i_gasLane;
	uint32 private immutable i_callbackGasLimit;
	/* constants */
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint32 private constant NUM_WORDS = 1;

	uint256 private immutable i_entranceFee;
	uint256 private immutable i_interval;

	// raffle variables
	address private s_mostRecentWinner;

	address payable[] private s_players;
	RaffleState private s_raffleState;
	uint256 private s_lastTimeStamp;

	/* events */
	event RaffleEnter(address indexed player);
	event RequestedRaffleWinner(uint256 indexed requestId);
	event WinnerPicked(address indexed winner);

	/* functions */
	constructor(
		address vrfCoordinatorV2,
		bytes32 _gasLane,
		uint64 _subscriptionId,
		uint32 _callbackGasLimit,
		uint256 _entranceFee,
		uint256 _interval
	) VRFConsumerBaseV2(vrfCoordinatorV2) {
		i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
		i_gasLane = _gasLane;
		i_interval = _interval;
		i_subscriptionId = _subscriptionId;
		i_callbackGasLimit = _callbackGasLimit;
		i_entranceFee = _entranceFee;
		s_raffleState = RaffleState.OPEN;
		s_lastTimeStamp = block.timestamp;
	}

	function enterRaffle() public payable {
		if (msg.value != i_entranceFee) {
			revert Raffle__sendExactEntryPrice();
		}
		if (s_raffleState != RaffleState.OPEN) {
			revert Raffle__RaffleNotOpen();
		}

		s_players.push(payable(msg.sender));
		// Emit an event when we update a dynamic array or mapping
		// "logs" the event for outside access (contract state logging)
		// Event naming convention: reverser function name
		emit RaffleEnter(msg.sender);
	}

	/**
	 * @dev This is the function that the Chainlink Keeper nodes call (override interface function)
	 * they look for `upkeepNeeded` to return True.
	 * the following should be true for this to return true:
	 * 1. The lottery is open.
	 * 2. The time interval has passed between raffle runs.
	 * 3. The contract has ETH.
	 * 4. Players are registered.
	 * 4. Implicity! Your subscription is funded with LINK.
	 */
	function checkUpkeep(
		bytes memory /* checkData */
	)
		public
		view
		override
		returns (
			bool upkeepNeeded,
			bytes memory /* performData */ // needs to be changed from calldata to memory inorder to pass empty string in performUpkeep (for checking if it should be performed)
		)
	{
		bool isOpen = (s_raffleState == RaffleState.OPEN);
		bool intervalPassed = ((block.timestamp - s_lastTimeStamp) >= i_interval);
		bool hasPlayers = (s_players.length > 0);
		bool hasWinnings = (address(this).balance > 0);
		upkeepNeeded = (isOpen && intervalPassed && hasPlayers && hasWinnings);
		/* can we comment the return out?
		 * ==> yes, because variable name is directly mapped to return definition.
		 * But compiler gives warning about implicite return
		 */
		return (upkeepNeeded, "0x0");
	}

	/**
	 * @dev Once `checkUpkeep` is returning `true`, this function is called, and if supplied performData is passed through
	 * and it kicks off a Chainlink VRF call to get a random number, to determine the winner.
	 */
	function performUpkeep(
		// get random number
		bytes calldata /* performData */
	) external override {
		// check if upkeep should be performed, otherwise anyone could just call this function and trigger upkeep/ drawing
		(bool upkeepNeeded, ) = checkUpkeep("");
		if (!upkeepNeeded) {
			revert Raffle__UpkeepNotNeeded(
				uint256(s_raffleState),
				s_players.length,
				address(this).balance
			);
		}
		// close raffle to avoid potential sideeffects
		s_raffleState = RaffleState.DRAWING;
		uint256 requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane,
			i_subscriptionId,
			REQUEST_CONFIRMATIONS,
			i_callbackGasLimit,
			NUM_WORDS
		);
		// Is this redundant? => yes, since chainlink contract is emiting the id and more info already
		emit RequestedRaffleWinner(requestId);
	}

	/**
	 * @dev after receiving random number this is getting executed
	 * so in this case the winner is determined and send his winings
	 */
	function fulfillRandomWords(
		uint256, /* requestId */
		uint256[] memory randomWords
	) internal override {
		// determine winner from random number
		uint256 winnerIndex = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[winnerIndex];
		s_mostRecentWinner = recentWinner;
		s_players = new address payable[](0);
		s_lastTimeStamp = block.timestamp;
		// send winnings (whole pot) to winner
		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		if (!success) {
			revert Raffle__TransferFailed();
		}
		emit WinnerPicked(recentWinner);
		// open raffle for new entries
		s_raffleState = RaffleState.OPEN;
	}

	/* view/ pure functions (getters) */
	function getRaffleState() public view returns (RaffleState) {
		return s_raffleState;
	}

	function getNumWords() public pure returns (uint256) {
		return NUM_WORDS;
	}

	function getRequestConfirmations() public pure returns (uint256) {
		return REQUEST_CONFIRMATIONS;
	}

	function getRecentWinner() public view returns (address) {
		return s_mostRecentWinner;
	}

	function getPlayer(uint256 index) public view returns (address) {
		return s_players[index];
	}

	function getLastTimeStamp() public view returns (uint256) {
		return s_lastTimeStamp;
	}

	function getInterval() public view returns (uint256) {
		return i_interval;
	}

	function getEntranceFee() public view returns (uint256) {
		return i_entranceFee;
	}

	function getNumberOfPlayers() public view returns (uint256) {
		return s_players.length;
	}
}
