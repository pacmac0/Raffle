import { frontEndContractsFile, frontEndABIFile } from "../helper-hardhat-config"
import fs from "fs"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const updateUI: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (process.env.UPDATE_FRONT_END) {
		console.log("Writing to front end...")
		console.log("Updating contract addresses...")
		const { network, ethers } = hre
		const chainId = "31337"
		const raffle = await ethers.getContract("Raffle")
		const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
		if (chainId in contractAddresses) {
			if (!contractAddresses[network.config.chainId!].includes(raffle.address)) {
				contractAddresses[network.config.chainId!].push(raffle.address)
			}
		} else {
			contractAddresses[network.config.chainId!] = [raffle.address]
		}
		fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
		console.log("Addresses updated!")
		// ABI part
		console.log("Updating ABIs...")
		const contractABIs = JSON.parse(fs.readFileSync(frontEndABIFile, "utf8"))
		const raffleABI = JSON.parse(
			fs.readFileSync("artifacts/contracts/Raffle.sol/Raffle.json", "utf8")
		)["abi"]

		if (!(contractABIs["raffle"] == raffleABI)) {
			console.log("Adding new ABI...")
			contractABIs["raffle"] = raffleABI
		}
		fs.writeFileSync(frontEndABIFile, JSON.stringify(contractABIs))
		console.log("ABIs updated!")

		console.log("Frontend files written!")
	}
}

export default updateUI
updateUI.tags = ["all", "frontend"]
