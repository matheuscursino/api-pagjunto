import express from 'express'
var paymentRouter = express.Router()
import { createPix, getChargeStatus, handlePagarmeWebhook  } from '../controller/payment.controller.js'


paymentRouter.post('/create-pix', createPix)
paymentRouter.post('/webhook', handlePagarmeWebhook);

export default paymentRouter;