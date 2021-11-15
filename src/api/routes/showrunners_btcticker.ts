import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import BtcTickerChannel from '../../showrunners/btcTickerChannel';
import middlewares from '../middlewares';
import { celebrate, Joi } from 'celebrate';

const route = Router();

export default (app: Router) => {
  app.use('/showrunners/btcticker', route);

  // to add an incoming feed
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
      Logger.debug('Calling /showrunners/btcticker endpoint with body: %o', req.body )

      try {
        const btcTicker = Container.get(BtcTickerChannel);
        const { success, data } = await btcTicker.sendMessageToContract(req.body.simulate);

        return res.status(201).json({ success, data });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  // to get new price
  route.post(
    '/get_new_price',
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /showrunners/btcticker endpoint with body: %o', req.body )

      try {
        const btcTicker = Container.get(BtcTickerChannel);
        const { data } = await btcTicker.getNewPrice();

        return res.status(201).json({ data });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

};
