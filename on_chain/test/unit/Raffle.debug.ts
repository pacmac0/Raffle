import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { network, deployments, ethers } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types"

describe("RaffleDebug", function () {
  let raffleContract: Raffle
  let raffle: Raffle
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
  let accounts: SignerWithAddress[]
  let deployer: SignerWithAddress
  let player: SignerWithAddress
  let raffleEntranceFee: BigNumber
  let interval: number
    
  beforeEach(async () => {
    if (!developmentChains.includes(network.name)) {
      throw "You need to be on a development chain to run tests"
    }
    accounts = await ethers.getSigners() // could also do with getNamedAccounts
    //   deployer = accounts[0] // deployer already specified in deploy function
    player = accounts[1]
    await deployments.fixture(["mocks", "raffle"])
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    raffleContract = await ethers.getContract("Raffle")
    raffle = raffleContract.connect(player)
    raffleEntranceFee = await raffle.getEntranceFee()
    interval = (await raffle.getInterval()).toNumber()
  })

  it("runs debug function", async () => {
    console.log("Nothing executed...")

    const fee = raffleEntranceFee.toString()
    console.log(`Entrance-Fee: ${fee}`)
    console.log(`Interval: ${interval}`)

  })
})