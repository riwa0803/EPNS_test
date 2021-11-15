import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import aaveChannel from '../../../showrunners-sdk/aaveChannel';
import middlewares from '../../middlewares';
import { celebrate, Joi } from 'celebrate';
import {handleResponse} from '../../../helpers/utilsHelper';

const route = Router();

export default (app: Router) => {
  app.use('/showrunners-sdk/aave', route);

  /**
   * Send Message
   * @description Send a notification via the aave showrunner
   * @param {boolean} simulate whether to send the actual message or simulate message sending
   */
  route.post(
    '/send_message',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /showrunners-sdk/aave/send_message endpoint with body: %o', req.body )
      try {
        const aave = Container.get(aaveChannel);
        const { success,  data } = await aave.sendMessageToContract(req.body.simulate);

        return handleResponse(res, 201, true, success, data);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return handleResponse(res, 500, false, 'error', JSON.stringify(e));
      }
    },
  );

  route.post(
    '/checkHealthFactor',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /showrunners-sdk/aave/send_message endpoint with body: %o', req.body )
      try {
        const aave = Container.get(aaveChannel);
        const { success,  data } = await aave.checkHealthFactor(null, null, req.body.simulate);

        return handleResponse(res, 201, true, success, data);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return handleResponse(res, 500, false, 'error', JSON.stringify(e));
      }
    },
  );
};
