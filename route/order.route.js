import express from 'express'
var orderRouter = express.Router()
import { getOrder, createOrder, updateOrder } from '../controller/order.controller.js'


orderRouter.get('/', getOrder)
orderRouter.post('/', createOrder)

export default orderRouter;