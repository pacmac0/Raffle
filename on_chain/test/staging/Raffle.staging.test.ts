import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { network, ethers, getNamedAccounts } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { Raffle } from "../../typechain-types"

developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle Unit Tests", function () {
			let raffle: Raffle
			let raffleEntranceFee: BigNumber
			let deployer: string
			beforeEach(async () => {
				deployer = (await getNamedAccounts()).deployer
				raffle = await ethers.getContract("Raffle", deployer)
				raffleEntranceFee = await raffle.getEntranceFee()
			})

			describe("fulfillRandomWords", function () {
				it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
					console.log("Setting up test...")
					const startingTimeStamp = await raffle.getLastTimeStamp()
					const accounts = await ethers.getSigners()

					// setup listener before we enter the raffle
					// Just in case the blockchain moves REALLY fast
					console.log("Setting up Listener...")
					await new Promise<void>(async (resolve, reject) => {
						raffle.once("WinnerPicked", async () => {
							console.log("WinnerPicked event fired!")
							try {
								// do asserts here
								const recentWinner = await raffle.getRecentWinner()
								const raffleState = await raffle.getRaffleState()
								const winnerEndingBalance = await accounts[0].getBalance()
								const endingTimeStamp = await raffle.getLastTimeStamp()

								await expect(raffle.getPlayer(0)).to.be.reverted
								assert.equal(recentWinner.toString(), accounts[0].address)
								assert.equal(raffleState, 0)
								assert.equal(
									winnerEndingBalance.toString(),
									winnerStartingBalance.add(raffleEntranceFee).toString()
								)
								assert(endingTimeStamp > startingTimeStamp)
								resolve()
							} catch (error) {
								console.log(error)
								reject(error)
							}
						})
						// Then entering the raffle
						console.log("Entering Raffle...")
						const tx = await raffle.enterRaffle({
							value: raffleEntranceFee,
						})
						await tx.wait(1)
						console.log("Ok, time to wait...")
						const winnerStartingBalance = await accounts[0].getBalance()

						// and this code(await promise block) WONT complete until our listener has finished listening!
						// because neither resolve or reject is called without the listener executing.
					})
				})
			})
	  })
