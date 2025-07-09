import express from 'express'
var paymentRouter = express.Router()
import { createPix, getChargeStatus, handlePagarmeWebhook  } from '../controller/payment.controller.js'


paymentRouter.post('/create-pix', createPix)
paymentRouter.get('/status/:charge_id/:orderId/:payerId/:paidValue/:name/:payerPhone', getChargeStatus)
paymentRouter.post('/webhook', handlePagarmeWebhook);

export default paymentRouter;