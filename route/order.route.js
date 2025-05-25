import express from 'express'
var orderRouter = express.Router()
import { getOrder, createOrder, updatePaymentsOrder, updateStatusOrder } from '../controller/order.controller.js'


orderRouter.get('/', getOrder)
orderRouter.post('/', createOrder)
orderRouter.put('/payments', updatePaymentsOrder)
orderRouter.put('/status', updateStatusOrder)


export default orderRouter;