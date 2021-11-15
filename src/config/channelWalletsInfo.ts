import dotenv from 'dotenv';
import { Wallet } from 'ethers';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}
const wallets = [
        {
            ensDomainExpiryPrivateKey_1: process.env.ENS_DOMAIN_EXPIRY_PRIVATE_KEY
        },
        {
            btcTickerPrivateKey_1: process.env.BTC_TICKER_PRIVATE_KEY
        },
        {
            ethTickerPrivateKey_1: process.env.ETH_TICKER_PRIVATE_KEY
        },
        {
            ethGasStationPrivateKey_1: process.env.ETH_GAS_STATION_PRIVATE_KEY
        },
        {
            compComptrollerPrivateKey_1: process.env.COMP_COMPTROLLER_PRIVATE_KEY
        },
        {
            walletTrackerPrivateKey_1: process.env.WALLET_TRACKER_PRIVATE_KEY
        },
        {
            everestPrivateKey_1: process.env.EVEREST_PRIVATE_KEY
        },
        {
            aavePrivateKey_1: process.env.AAVE_PRIVATE_KEY
        },
        {
            truefiPrivateKey_1: process.env.TRUEFI_PRIVATE_KEY
        },
        {
            alphahomoraPrivateKey_1: process.env.ALPHAHOMORA_PRIVATE_KEY
        },
        {
            uniSwapPrivateKey_1: process.env.UNISWAP_PRIVATE_KEY
        },
        {
            riktestchannelPrivateKey_1: process.env.RIK_TEST_CHANNEL_KEY
        }
]

const walletsKV = wallets.reduce((initial, value) => {
    Object.keys(value).map(key => initial[key] = value[key])
    return initial;
}, {})

export default {
    mainWalletPrivateKey: process.env.MASTER_WALLET_PRIVATE_KEY,
    wallets,
    walletsKV
}
