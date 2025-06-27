import express from 'express'
var paymentRouter = express.Router()
import { createPix } from '../controller/payment.controller.js'


paymentRouter.post('/create-pix', createPix)
paymentRouter.get('/status/:charge_id')

export default paymentRouter;