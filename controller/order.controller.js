import orderModel from '../model/order.model.js'
import mongoose from 'mongoose'

var reqOrderId;
var orderDoc;


export function getOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    var reqPartnerId = reqBodyValues[0]
    reqOrderId = reqBodyValues[1]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send()
        } else {
            res.status(200).send(orderDoc)
        }
    })
}

export function createOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    var reqPartnerId = reqBodyValues[0]
    var reqTotalValue = reqBodyValues[1]

    var orderId = new mongoose.Types.ObjectId()
    const order = new orderModel({
        orderId: orderId,
        partnerId: reqPartnerId,
        totalValue: reqTotalValue,
        paidValue: 0,
        paymentsNumber: 0,
        status: 'fresh'
    })
    order.save().then(() => {
        res.status(201).send(orderId)
    })
}

export function updatePaymentsOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    var reqPartnerId = reqBodyValues[0]
    reqOrderId = reqBodyValues[1]
    var reqPaidValue = reqBodyValues[2]
    var reqPaymentsNumber = reqBodyValues[3]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send()
        } else {
            orderModel.updateOne({orderId: reqOrderId}, {
                paidValue: reqPaidValue,
                paymentsNumber: reqPaymentsNumber
            }).then(() => {
                res.status(200).send()
            })
        }
    })
}

export function updateStatusOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    var reqPartnerId = reqBodyValues[0]
    reqOrderId = reqBodyValues[1]
    var reqOrderStatus = reqBodyValues[2]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send()
        } else {
            orderModel.updateOne({orderId: reqOrderId}, {
                status: reqOrderStatus,
            }).then(() => {
                res.status(200).send()
            })
        }
    })
}

async function getOrderDoc(){
    orderDoc = await orderModel.findOne({orderId: reqOrderId}).lean()
}
