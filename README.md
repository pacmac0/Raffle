# Lottery project
This is an intermideat project to learn some more solidity functionalities and concepts.

### Goal:
- A raffle where users can buy a ticket to have a chance of winning the pot. 
- Integrate randomnes using Chainlink
- Build timer for drawing winners, with chainlink keepers
  
### Notes:
- Chainlink keepers (automated execution) is a 3 function, 2 transaction process. Function naming is given by inheritence.
  1. checkUpkeep: condition when to execute is checked
  2. performUpkeep: The request for specified randomness is executed
  3. fulfillRandomWords: executing the code the random number(s) needed for
- Events are used to log information as indexed or "blop" to a special storage, not accessable by smart contracts. Used for of-chain up-keeping and so on.

#### __("Possible additions")__ 
- Integrate multiple winning levels
- Integrate a casino fee

### Set-up dependencies
```
yarn add --dev hardhat
yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv @typechain/ethers-v5 @typechain/hardhat @types/chai @types/node ts-node typechain typescript
```

### Further Resources
- [Chainlink VRF](https://docs.chain.link/docs/vrf/v2/introduction/)
- [Chainlink Automation, formerly upkeep](https://docs.chain.link/docs/chainlink-automation/introduction/)
  
### Useful comands:
- yarn hardhat deploy
- yarn lint (script comand)
- yarn format
- yarn coverage
- yarn test
- yarn debug (my own custome test for debuging)
- hh node (start dev blockchain, that keep running)
