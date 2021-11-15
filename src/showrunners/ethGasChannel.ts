// @name: ETH GAS Cnannel
// @version: 1.1.1
// @recent_changes: Changed Price Threshold logic

import { Service, Inject, Container } from 'typedi';
import config from '../config';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import events from '../subscribers/events';

import { ethers } from 'ethers';
import { truncateSync } from 'fs';

const bent = require('bent'); // Download library
const moment = require('moment'); // time library
// const epnsNotify = require('../helpers/epnsNotifyHelper');
import epnsNotify from '../helpers/epnsNotifyHelper';

// variables for mongoDb and redis
const GAS_PRICE_FOR_THE_DAY = 'gas_price_for_the_day';
const HIGH_PRICE_FLAG = 'ethgas_high_price';
const PRICE_THRESHOLD_MULTIPLIER = 1.3; // multiply by 1.3x for checking high price

@Service()
export default class GasStationChannel {
  constructor(
    @Inject('logger') private logger,
    @Inject('cached') private cached,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {
    //initializing cache
    this.cached.setCache(HIGH_PRICE_FLAG, false);
    this.cached.setCache(GAS_PRICE_FOR_THE_DAY, 0);
  }

  //To form and write to smart contract
  public async sendMessageToContract(simulate) {
    const logger = this.logger;

    logger.debug(`[${new Date(Date.now())}]-[ETH Gas]-Getting gas price, forming and uploading payload and interacting with smart contract...`);

    return await new Promise((resolve, reject) => {
      this.getGasPrice()
      .then(info =>{
        if(!info.changed){
          const message = `[${new Date(Date.now())}]-[ETH Gas]- Gas price status not changed`;

          resolve({
            success: message
          });

          logger.info(message);
        }
        else{
          this.getNewPrice(info)
            .then(payload => {
              // handle payloads, etc
              epnsNotify.uploadToIPFS(payload, logger, simulate)
                .then(async (ipfshash) => {
                  // Sign the transaction and send it to chain
                  const walletAddress = ethers.utils.computeAddress(config.ethGasStationPrivateKey);

                  // Call Helper function to get interactableContracts
                  const epns = epnsNotify.getInteractableContracts(
                    config.web3RopstenNetwork,                                              // Network for which the interactable contract is req
                    {                                                                       // API Keys
                      etherscanAPI: config.etherscanAPI,
                      infuraAPI: config.infuraAPI,
                      alchemyAPI: config.alchemyAPI
                    },
                    config.ethGasStationPrivateKey,                                         // Private Key of the Wallet sending Notification
                    config.deployedContract,                                                // The contract address which is going to be used
                    config.deployedContractABI                                              // The contract abi which is going to be useds
                  );

                  logger.info(`[${new Date(Date.now())}]-[ETH Gas]- Payload prepared: %o, ipfs hash generated: %o, sending data to on chain from address %s...`, payload, ipfshash, walletAddress);

                  const storageType = 1; // IPFS Storage Type
                  const txConfirmWait = 0; // Wait for 0 tx confirmation

                  // Send Notification
                  await epnsNotify.sendNotification(
                    epns.signingContract,                                           // Contract connected to signing wallet
                    walletAddress,                                                  // Recipient to which the payload should be sent
                    parseInt(payload.data.type),                                    // Notification Type
                    storageType,                                                    // Notificattion Storage Type
                    ipfshash,                                                       // Notification Storage Pointer
                    txConfirmWait,                                                  // Should wait for transaction confirmation
                    logger,                                                         // Logger instance (or console.log) to pass
                    simulate                                                        // Passing true will not allow sending actual notification
                  ).then ((tx) => {
                    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- Transaction mined: %o | Notification Sent`, tx.hash);
                    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- 🙌 ETHGas Tracker Channel Logic Completed!`);
                    resolve(tx);
                  })
                  .catch (err => {
                    logger.error(`[${new Date(Date.now())}]-[ETH Gas]- 🔥Error --> sendNotification(): %o`, err);
                    reject(err);
                  });
                })
                .catch (err => {
                  logger.error(`[${new Date(Date.now())}]-[ETH Gas]- 🔥Error --> uploadToIPFS(%o, logger): %o`, payload, err)
                  reject(err);
                });
            })
            .catch(err => {
              logger.error(`[${new Date(Date.now())}]-[ETH Gas]- Unable to proceed with payload, error: %o`, err);
              reject(err);
              throw err;
            });
        }
      })

    });
  }

  // To get the gas price
  public async getGasPrice() {
    const logger = this.logger;
    const cache = this.cached;

    logger.debug(`[${new Date(Date.now())}]-[ETH Gas]- Getting gas price from ETH Gas Station`);

    return await new Promise((resolve, reject) => {
      const getJSON = bent('json');
      const gasroute = 'api/ethgasAPI.json';
      const pollURL = `${config.gasEndpoint}${gasroute}?api-key=${config.gasAPIKey}`;

      getJSON(pollURL).then(async result => {
        let averageGas10Mins = result.average / 10;
        logger.info(`[${new Date(Date.now())}]-[ETH Gas]- average: %o`, averageGas10Mins);

        //adding average gas every 10mins for 24 hrs to get the todaysAverageGasPrice
        cache.addCache(GAS_PRICE_FOR_THE_DAY, averageGas10Mins);
        const getPricee = await cache.getCache(GAS_PRICE_FOR_THE_DAY);
        logger.info(`[${new Date(Date.now())}]-[ETH Gas]- cache gotten from redis: %o`, getPricee);

        // assigning the average gas price for 90 days to variable
        let movingAverageGasForTheLast90DaysFromMongoDB = await this.getAverageGasPrice();
        logger.info(`[${new Date(Date.now())}]-[ETH Gas]- moving average gas: %o`, movingAverageGasForTheLast90DaysFromMongoDB.average);

        // assigning the threshold to a variable
        let highPriceFlag = await cache.getCache(HIGH_PRICE_FLAG);

        // checks if the result gotten every 10 minutes is higher than the movingAverageGasForTheLast90DaysFromMongoDB
        if ((movingAverageGasForTheLast90DaysFromMongoDB.average * PRICE_THRESHOLD_MULTIPLIER) < averageGas10Mins && highPriceFlag == "false") {
          const info = {
            changed: true,
            gasHigh: true,
            currentPrice: averageGas10Mins,
            averagePrice: movingAverageGasForTheLast90DaysFromMongoDB.average
          }

          highPriceFlag = true;
          cache.setCache(HIGH_PRICE_FLAG, highPriceFlag);

          resolve(info);
        }

        // checks if the result gotten every 10 minutes is less than the movingAverageGasForTheLast90DaysFromMongoDB
        else if (movingAverageGasForTheLast90DaysFromMongoDB.average > averageGas10Mins && highPriceFlag == "true") {
          const info = {
            changed: true,
            gasHigh: false,
            currentPrice: averageGas10Mins,
            averagePrice: movingAverageGasForTheLast90DaysFromMongoDB.average
          }

          highPriceFlag = false;
          cache.setCache(HIGH_PRICE_FLAG, highPriceFlag);

          resolve(info);
        }
        else{
          const info = {
            changed: false
          }

          resolve(info);
        }

        logger.info(`[${new Date(Date.now())}]-[ETH Gas]- Checking Logic is now: %s`, (highPriceFlag ? "High Price coming down" : "Normal Price going up"));
      });
    });
  }

  // To get new gas price
  public async getNewPrice(info) {
    const logger = this.logger;

    return await new Promise(async (resolve, reject) => {
      const gasPrice = Math.trunc(info.currentPrice);
      const avgPrice = Math.trunc(info.averagePrice);

      let title;
      let payloadTitle;

      let message;
      let payloadMsg;

      if (info.gasHigh) {
        // Gas is high
        title = 'Eth Gas Price Movement';
        payloadTitle = `Eth Gas Price Movement ⬆`;

        message = `Eth Gas Price is over the usual average, current cost: ${gasPrice} Gwei`;
        payloadMsg = `[t:⬆] Gas Price are way above the normal rates.\n\n[d:Current] Price: [t: ${gasPrice} Gwei]\n[s:Usual] Price: [b: ${avgPrice} Gwei] [timestamp: ${Math.floor(new Date() / 1000)}]`;
      }
      else {
        // Gas will be low
        title = 'Eth Gas Price Movement';
        payloadTitle = `Eth Gas Price Movement ⬇`;

        message = `Eth Gas Price is back to normal, current cost: ${gasPrice} Gwei`;
        payloadMsg = `[d:⬇] Hooray! Gas Price is back to normal rates.\n\n[d:Current] Price: [d: ${gasPrice} Gwei]\n[s:Usual] Price: [b: ${avgPrice} Gwei] [timestamp: ${Math.floor(new Date() / 1000)}]`;
      }

      const payload = await epnsNotify.preparePayload(
        null,                                                               // Recipient Address | Useful for encryption
        1,                                                                  // Type of Notification
        title,                                                              // Title of Notification
        message,                                                            // Message of Notification
        payloadTitle,                                                       // Internal Title
        payloadMsg,                                                         // Internal Message
        null,                                                               // Internal Call to Action Link
        null,                                                               // internal img of youtube link
      );

      resolve(payload);
    });
  }

  // To update gas price average
  public async updateGasPriceAverage() {
    const logger = this.logger;
    const cache = this.cached;

    logger.debug(`[${new Date(Date.now())}]-[ETH Gas]- updating mongodb`);

    let gasPriceEstimate = await cache.getCache(GAS_PRICE_FOR_THE_DAY);
    if (!gasPriceEstimate || gasPriceEstimate == "0") {
      await this.getGasPrice();
      gasPriceEstimate = await cache.getCache(GAS_PRICE_FOR_THE_DAY);
    }

    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- todays average gas price before revert: %o`, gasPriceEstimate)

    const todaysAverageGasPrice = gasPriceEstimate;
    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- todays average gas price: %o`, todaysAverageGasPrice);

    await cache.setCache(GAS_PRICE_FOR_THE_DAY, 0);
    const gasPriceAfterRever = await cache.getCache(GAS_PRICE_FOR_THE_DAY)
    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- todays average gas price after revert: %o`, gasPriceAfterRever);

    let movingAverageForYesterdayFromMongoDB = await this.getAverageGasPrice();
    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- last 90 days moving average: %o`, movingAverageForYesterdayFromMongoDB.average);

    let todaysMovingAverage = Number(todaysAverageGasPrice)
    if (movingAverageForYesterdayFromMongoDB.average != 0) {
      todaysMovingAverage =
      ((movingAverageForYesterdayFromMongoDB.average * 90) + (todaysAverageGasPrice * 1)) / (90 + 1);
    }
    logger.info(`[${new Date(Date.now())}]-[ETH Gas]- todays moving average: %o`, todaysMovingAverage)

    await this.setGasPrice(todaysMovingAverage);

    return { average: todaysMovingAverage }
  }

  // GAS PRICE HELPER METHODS
  // ----------
  /**
   * Set gas price
   * @description adds average gas price for a day to mongodb
   * @param {Number} price
   * @return {Promise<{ gasPrice: IGas }>}
   */
  public async setGasPrice(price: Number): Promise<{ gasPrice: IGas }> {
    this.GasPriceModel = Container.get('GasPriceModel');
    const gasPrice = await this.GasPriceModel.find()
        .sort({ _id: -1 })
      .limit(1);
    let new_price = price
    if (gasPrice.length > 0) {
      new_price = Number(gasPrice[0].price) + Number(price)
      new_price = Number(new_price) / 2
    }
    this.logger.info(`[${new Date(Date.now())}]-[ETH Gas]- gas price set: %o, price: %o`, new_price, price);
    let latestGasPrice = await this.GasPriceModel.create({
      price: new_price,
    });
    if (!latestGasPrice) {
      throw new Error('Gas Price cannot be created');
    }
    latestGasPrice = latestGasPrice.toObject();
    return { gasPrice: latestGasPrice };
  }

  /**
   * Get average gas price
   * @description returns average gas price for a number of days from mongodb
   * @return {Promise<{ average: Number }>}
   */
  public async getAverageGasPrice(): Promise<{ average: Number }> {
    // this.logger.silly('Get gas price');
    this.GasPriceModel = Container.get('GasPriceModel');
    try {
      const gasPrices = await this.GasPriceModel.find()
        .sort({ _id: -1 })
        .limit(1);
      let price = 0;
      if (gasPrices.length > 0) {
        price = gasPrices[0].price
      }
      return { average: price };
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Two DP
   * @description round up a float value top 2 decimal places
   * @param {Number} value
   * @return {Number}
   */
  public twoDP(value: Number) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  public async clearGasPrices(): Promise<null> {
    // this.logger.silly('Get gas price');
    this.GasPriceModel = Container.get('GasPriceModel');
    await this.GasPriceModel.deleteMany({});
    return null;
  }
}
