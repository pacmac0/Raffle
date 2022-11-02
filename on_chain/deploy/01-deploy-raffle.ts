import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

import {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}  from "../helper-hardhat-config"
import verify from "../utils/verify"
import { Contract } from "ethers"

const FUND_AMOUNT = "1000000000000000000000"

const deployRaffle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, getNamedAccounts, network } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId
	// const chainId = 13317
    let vrfCoordinatorV2Mock: Contract | undefined
	let vrfCoordinatorV2Address: string | undefined
	let subscriptionId: string | undefined

    // deploy mocks in case of local dev-chain, else use config data
	if (chainId == 31337) {
        log("Subscribing to VRF...")
		// create VRFV2 Subscription on local mock
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
	} else {
        // supply VRFV2 configuration for used network from config file
        vrfCoordinatorV2Address = networkConfig[network.config.chainId!]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[network.config.chainId!]["subscriptionId"]
    }

    // deploy raffle contract
    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
    log("----------------------------------------------------")
    log("Deploying raffle contract and waiting for confirmations...")
    const args: any[] = [
        vrfCoordinatorV2Address,
        networkConfig[network.config.chainId!]["gasLane"],
        subscriptionId,
        networkConfig[network.config.chainId!]["callbackGasLimit"],
        networkConfig[network.config.chainId!]["raffleEntranceFee"],
        networkConfig[network.config.chainId!]["keepersUpdateInterval"],
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })
    log(`Raffle deployed at ${raffle.address}`)
    log("----------------------------------------------------")

    // Addition needed with newer chainlink versions ^0.4.1
    // add raffle contract to subscription as consumer in case of local dev-net => made vrfCoordinatorV2Mock global in process
    if (chainId == 31337) {
        log('Adding consumer...')
        await vrfCoordinatorV2Mock!.addConsumer(subscriptionId, raffle.address)
        log('Consumer was added!')
    } else {
        // TODO for local network the raffle contract needed to be added as a consumer,
        // maybe this can be done in the web-interface for test-net or has to be added here
    }

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    }

    log("Enter raffle with command:")
    const networkName = network.name == "hardhat" ? "localhost" : network.name
    log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`)
    log("----------------------------------------------------")
}

export default deployRaffle
deployRaffle.tags = ["all", "raffle"]