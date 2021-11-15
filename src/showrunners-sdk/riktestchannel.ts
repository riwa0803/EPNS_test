// @name: riktestchannel
// @version: 1.0
// @recent_changes: Changed Logic to be modular

import { Service, Inject } from 'typedi';
import config from '../config';
import channelWalletsInfo from '../config/channelWalletsInfo';
import { ethers, logger } from 'ethers';
import epnsHelper, {InfuraSettings, NetWorkSettings, EPNSSettings} from '@epnsproject/backend-sdk'
const channelKey = channelWalletsInfo.walletsKV['riktestchannelPrivateKey_1']

const infuraSettings: InfuraSettings = {
  projectID: config.infuraAPI.projectID,
  projectSecret: config.infuraAPI.projectSecret
}
const settings: NetWorkSettings = {
  alchemy: config.alchemyAPI,
  infura: infuraSettings,
  etherscan: config.etherscanAPI
}
const epnsSettings: EPNSSettings = {
  network: config.web3RopstenNetwork,
  contractAddress: config.deployedContract,
  contractABI: config.deployedContractABI
}
const sdk = new epnsHelper(config.web3MainnetNetwork, channelKey, settings, epnsSettings)

@Service()
export default class MyChannel {
  // To form and write to smart contract
  public async sendMessageToContract(simulate) {
    logger.info(`[${new Date(Date.now())}]-[riktestchannel]- uploading payload and interacting with smart contract...`);
    const title = 'riktestchannel';
    const message = `Hello World`;
    const payloadTitle = 'riktestchannel';
    const payloadMsg = `Hello World`;
    const channelAddress = ethers.utils.computeAddress(channelWalletsInfo.walletsKV['riktestchannelPrivateKey_1'])
    const notificationType = 1; //broadcasted notification
    const tx = await sdk.sendNotification(channelAddress, title, message, payloadTitle, payloadMsg, notificationType, simulate)
    logger.info(tx);
    return{
      success: true,
      data: tx
    }
  }
}
