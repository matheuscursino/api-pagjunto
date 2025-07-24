import express from 'express'
var orderRouter = express.Router()
import { getOrder, createOrder, updatePaymentsOrder } from '../controller/order.controller.js'


orderRouter.get('/', getOrder)
orderRouter.post('/', createOrder)
orderRouter.put('/payments', updatePaymentsOrder)

export default orderRouter;