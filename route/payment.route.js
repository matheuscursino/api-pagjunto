import express from 'express'
var paymentRouter = express.Router()
import { createPix, getChargeStatus } from '../controller/payment.controller.js'


paymentRouter.post('/create-pix', createPix)
paymentRouter.get('/status/:charge_id', getChargeStatus)

export default paymentRouter;