import orderModel from '../model/order.model.js'
import partnerModel from '../model/partner.model.js'
import mongoose from 'mongoose'

var reqOrderId;
var reqPartnerId
var orderDoc;
var partnerDoc;


async function getPartnerDoc(){
    partnerDoc = await partnerModel.findOne({partnerId: reqPartnerId}).lean()
}

export function getOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    reqOrderId = reqBodyValues[0]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send()
        } else {
            res.status(200).send(orderDoc)
        }
    }).catch(() => {
        res.status(500).send()
    })
}

export function createOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    reqPartnerId = reqBodyValues[0]
    var reqTotalValue = reqBodyValues[1]

    getPartnerDoc().then(() => {
        if(partnerDoc == null){
            console.log(partnerDoc)
        } else {
            var orderId = new mongoose.Types.ObjectId()
            const order = new orderModel({
                orderId: orderId,
                partnerId: reqPartnerId,
                totalValue: reqTotalValue,
                paidValue: 0,
                paymentsNumber: 0,
                payersIds: [],
                status: 'fresh'
            })
            order.save().then(() => {
                res.status(201).send(orderId)
            })
        }
    }).catch(() => {
        res.status(500).send()
    })
}

export function updatePaymentsOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    reqOrderId = reqBodyValues[0]
    var reqPaidValue = reqBodyValues[1]
    var reqPaymentsNumber = reqBodyValues[2]
    var reqPayersIds = reqBodyValues[3]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send()
        } else {
            orderModel.updateOne({orderId: reqOrderId}, {
                paidValue: reqPaidValue,
                paymentsNumber: reqPaymentsNumber,
                $push: { payersIds: reqPayersIds }
            }).then(() => {
                res.status(200).send()
            })
        }
    }).catch(() => {
        res.status(500).send()
    })
}

export function updateStatusOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    reqOrderId = reqBodyValues[0]
    var reqOrderStatus = reqBodyValues[1]

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
    }).catch(() => {
        res.status(500).send()
    })
}

async function getOrderDoc(){
    orderDoc = await orderModel.findOne({orderId: reqOrderId}).lean()
}
