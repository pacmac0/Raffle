import "@typechain/hardhat"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-ethers"
import "hardhat-gas-reporter"
import "dotenv/config"
import "solidity-coverage"
import "hardhat-deploy"
import { HardhatUserConfig } from "hardhat/config"

const INFURA_GOERLI_RPC_URL: string = process.env.INFURA_GOERLI_RPC_URL || ""
const PRIVATE_KEY: string = process.env.PRIVATE_KEY || ""
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY || ""

const config: HardhatUserConfig = {
	solidity: "0.8.8",
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337,
		},
		localhost: {
			chainId: 31337,
		},
		goerli: {
			url: INFURA_GOERLI_RPC_URL,
			accounts: [PRIVATE_KEY],
			chainId: 5,
		},
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
		outputFile: "gas-report.txt",
		noColors: true,
		// coinmarketcap: COINMARKETCAP_API_KEY,
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		player1: {
			default: 1,
		},
		player2: {
			default: 2,
		},
	},
	mocha: {
		timeout: 180000, // 180 sec.
	},
}

export default config
