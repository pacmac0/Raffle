import Head from "next/head"
import styles from "../styles/Home.module.css"
import Header from "../components/Header"
import RaffleEntrance from "../components/RaffleEntrance"
import { useMoralis } from "react-moralis"

const supportedChains = ["31337", "4"]

export default function Home() {
	const { isWeb3Enabled, chainId } = useMoralis()

	return (
		<div className={styles.container}>
			<Head>
				<title>Raffle</title>
				<meta name="description" content="Join the lesson raffle" />
				<link rel="icon" href="" />
			</Head>
			<Header />
			{isWeb3Enabled ? (
				<div>
					{supportedChains.includes(parseInt(chainId).toString()) ? (
						<div className="flex flex-row">
							<RaffleEntrance className="p-8" />
						</div>
					) : (
						<div>{`Please switch to a supported chainId. The supported Chain Ids are: ${supportedChains}`}</div>
					)}
				</div>
			) : (
				<div>Please connect to a Wallet</div>
			)}
		</div>
	)
}
