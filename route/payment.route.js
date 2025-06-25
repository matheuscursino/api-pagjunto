import express from 'express'
var paymentRouter = express.Router()
import { createPix } from '../controller/payment.controller.js'


paymentRouter.post('/', createPix)

export default paymentRouter;