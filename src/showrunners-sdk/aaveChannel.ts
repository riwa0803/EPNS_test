// @name: Aave Channel
// @version: 1.0

import { Service, Inject } from 'typedi';
import config from '../config';
import channelWalletsInfo from '../config/channelWalletsInfo';
import { ethers, logger} from 'ethers';
import epnsHelper, {InfuraSettings, NetWorkSettings, EPNSSettings} from '@epnsproject/backend-sdk'
const channelKey = channelWalletsInfo.walletsKV['aavePrivateKey_1']

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
const NETWORK_TO_MONIOR = config.web3PolygonMainnetRPC
const sdk = new epnsHelper(NETWORK_TO_MONIOR, channelKey, settings, epnsSettings)

const HEALTH_FACTOR_THRESHOLD = 1.6;
const CUSTOMIZABLE_SETTINGS = {
  'precision': 3,
}


@Service()
export default class AaveChannel {
  // To form and write to smart contract
  public async sendMessageToContract(simulate) {
    //simulate object settings START
    const logicOverride = typeof simulate == 'object' ? ((simulate.hasOwnProperty("logicOverride") && simulate.logicOverride.mode) ? simulate.logicOverride.mode : false) : false;
    const simulateAaveNetwork = logicOverride && simulate.logicOverride.hasOwnProperty("aaveNetwork") ? simulate.logicOverride.aaveNetwork : false;
    let aave: any;
    if(simulateAaveNetwork){
      aave = sdk.advanced.getInteractableContracts(simulateAaveNetwork, settings, channelKey, config.aaveLendingPoolDeployedContractPolygonMainnet, config.aaveLendingPoolDeployedContractABI);
    }
    else{
      aave = await sdk.getContract(config.aaveLendingPoolDeployedContractPolygonMainnet, config.aaveLendingPoolDeployedContractABI)
    }
    //simulate object settings END

    const users = await sdk.getSubscribedUsers()
    const promises = users.map(user => this.checkHealthFactor(aave, user, simulate))
    return await Promise.all(promises)
  }
  public async checkHealthFactor(aave, userAddress, simulate) {
    //simulate object settings START
    const logicOverride = typeof simulate == 'object' ? ((simulate.hasOwnProperty("logicOverride") && simulate.logicOverride.mode) ? simulate.logicOverride.mode : false) : false;
    const simulateApplyToAddr = logicOverride && simulate.logicOverride.hasOwnProperty("applyToAddr") ? simulate.logicOverride.applyToAddr : false;
    const simulateAaveNetwork = logicOverride && simulate.logicOverride.hasOwnProperty("aaveNetwork") ? simulate.logicOverride.aaveNetwork : false;
    if(!aave){
      if(simulateAaveNetwork){
        aave = sdk.advanced.getInteractableContracts(simulateAaveNetwork, settings, channelKey, config.aaveLendingPoolDeployedContractPolygonMainnet, config.aaveLendingPoolDeployedContractABI);
      }
      else{
        aave = await sdk.getContract(config.aaveLendingPoolDeployedContractPolygonMainnet, config.aaveLendingPoolDeployedContractABI)
      }
    }
    if(!userAddress){
      if(simulateApplyToAddr){
        userAddress = simulateApplyToAddr
      }
      else{
        logger.info('userAddress is not defined')
      }
    }
    //simulate object settings END
      
    const userData = await aave.contract.getUserAccountData(userAddress)
    let  healthFactor = ethers.utils.formatEther(userData.healthFactor)
    logger.info("For wallet: %s, Health Factor: %o", userAddress, healthFactor);
    if(Number(healthFactor) <= HEALTH_FACTOR_THRESHOLD){
      const precision = CUSTOMIZABLE_SETTINGS.precision;
      const newHealthFactor = parseFloat(healthFactor).toFixed(precision);
      const title = "Aave Liquidity Alert!";
      const message =  userAddress + " your account has healthFactor "+ newHealthFactor + ". Maintain it above 1 to avoid liquidation.";
      const payloadTitle = "Aave Liquidity Alert!";
      const payloadMsg = `Dear [d:${userAddress}] your account has healthFactor ${newHealthFactor} . Maintain it above 1 to avoid liquidation.[timestamp: ${Math.floor(new Date() / 1000)}]`;
      const notificationType = 3;
      const tx = await sdk.sendNotification(userAddress, title, message, payloadTitle, payloadMsg, notificationType, simulate)
      logger.info(tx)
      return{
        success: true,
        data: tx
      }
    }
    else{
      logger.info("Wallet: %s is SAFE with Health Factor: %o", userAddress, healthFactor);
      return{
        success: false,
        data: userAddress + " is not about to get liquidated"
      }
    }
  }
}

