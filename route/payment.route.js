import express from 'express'
var paymentRouter = express.Router()
import { createPix, handlePagarmeWebhook  } from '../controller/payment.controller.js'


paymentRouter.post('/create-pix', createPix)
paymentRouter.post('/webhook', handlePagarmeWebhook);

export default paymentRouter;