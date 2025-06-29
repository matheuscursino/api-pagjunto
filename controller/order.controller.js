import orderModel from '../model/order.model.js'
import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'

import mongoose from 'mongoose'

var reqOrderId;
var reqPartnerId;
var orderDoc;
var partnerDoc;
var adminDoc;
var reqAdminPassword;


async function getPartnerDoc(){
    partnerDoc = await partnerModel.findOne({partnerId: reqPartnerId}).lean()
}

async function getOrderDoc(){
    orderDoc = await orderModel.findOne({orderId: reqOrderId}).lean()
}

async function getAdminDoc(){
    adminDoc = await adminModel.findOne({adminPassword: reqAdminPassword}).lean()
}


export function getOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    reqOrderId = reqBodyValues[0]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send({error: "order doesnt exist"})
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
    var reqApiKey = reqBodyValues[2]
    
    getPartnerDoc().then(() => {
        if(partnerDoc == null){
            res.status(404).send({error: "partner doesnt exist"})
        } else {
            if (reqApiKey == partnerDoc.apiKey){
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
            } else {
                res.status(403).send()
            }
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
    reqAdminPassword = reqBodyValues[4]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send({error: "order doesnt exist"})
        } else {
            getAdminDoc().then(() => {
                if(adminDoc == null){
                    res.status(403).send()
                } else {
                    if(orderDoc.status === "fresh" & orderDoc.totalValue != (orderDoc.paidValue + reqPaidValue)){
                        orderModel.updateOne({orderId: reqOrderId}, {
                            $inc: { paidValue: reqPaidValue, paymentsNumber: reqPaymentsNumber },
                            $push: { payersIds: reqPayersIds },
                            status: "progress"
                        })
                        .then(() => {
                            res.status(200).send()
                        })
                    } else if(orderDoc.status === "fresh" & orderDoc.totalValue == (orderDoc.paidValue + reqPaidValue)){
                        orderModel.updateOne({orderId: reqOrderId}, {
                            $inc: { paidValue: reqPaidValue, paymentsNumber: reqPaymentsNumber },
                            $push: { payersIds: reqPayersIds },
                            status: "paid"
                        }).then(() => {
                            res.status(200).send()
                        })
                    } else if(orderDoc.status === "progress" & orderDoc.totalValue == (orderDoc.paidValue + reqPaidValue)){
                        orderModel.updateOne({orderId: reqOrderId}, {
                            $inc: { paidValue: reqPaidValue, paymentsNumber: reqPaymentsNumber },
                            $push: { payersIds: reqPayersIds },
                            status: "paid"
                        }).then(() => {
                            res.status(200).send()
                        })
                    } else {
                        orderModel.updateOne({orderId: reqOrderId}, {
                            $inc: { paidValue: reqPaidValue, paymentsNumber: reqPaymentsNumber },
                            $push: { payersIds: reqPayersIds }
                        })
                        .then(() => {
                            res.status(200).send()
                        })
                    }
                }
            })
            .catch((e) => {
                res.status(500).send()
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
    reqAdminPassword = reqBodyValues[2]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            res.status(404).send({error: "order doesnt exist"})
        } else {
            getAdminDoc().then(() => {
                if(adminDoc == null){
                    res.status(403).send()
                } else{
                    orderModel.updateOne({orderId: reqOrderId}, {
                        status: reqOrderStatus,
                    }).then(() => {
                        res.status(200).send()
                    })
                }
            })
            .catch((e) => {
                res.status(500).send()
            })
        }
    }).catch(() => {
        res.status(500).send()
    })
}