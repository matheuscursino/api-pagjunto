import orderModel from '../model/order.model.js'

export function getOrder(req, res) {
    res.send("/order get ok")
}

export function createOrder(req, res) {
    res.send("/order post ok")
}

export function updateOrder(req, res) {
    res.send("/order update ok")
}