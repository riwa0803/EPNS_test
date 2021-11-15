import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import HelloWorldChannel from '../../../showrunners-sdk/myFirstEPNSChannel';
import middlewares from '../../middlewares';
import { celebrate, Joi } from 'celebrate';

const route = Router();

export default (app: Router) => {
  app.use('/showrunners-sdk/myFirstEPNSChannel', route);

  // to add an incoming feed
  route.post(
    '/send_message',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()]
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /showrunners-sdk/myFirstEPNSChannel endpoint with body: %o', req.body )

      try {
        const helloTicker = Container.get(MyFirstEPNSChannel);
        const { success, data } = await helloTicker.sendMessageToContract(req.body.simulate);

        return res.status(201).json({ success, data });
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
}
