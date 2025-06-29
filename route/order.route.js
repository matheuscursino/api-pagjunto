import express from 'express'
var orderRouter = express.Router()
import { getOrder, createOrder, updatePaymentsOrder, getOrdersByPartner } from '../controller/order.controller.js'


orderRouter.get('/', getOrder)
orderRouter.post('/', createOrder)
orderRouter.put('/payments', updatePaymentsOrder)
orderRouter.get('/by-partner', getOrdersByPartner)


export default orderRouter;