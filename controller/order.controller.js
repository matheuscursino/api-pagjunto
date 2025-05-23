import orderModel from '../model/order.model.js'
var reqOrderId
var orderDoc


export function getOrder(req, res) {
    var reqBodyValues = Object.values(req.body)
    var reqPartnerId = reqBodyValues[0]
    var reqUserId = reqBodyValues[1]
    reqOrderId = reqBodyValues[2]

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
    var reqUserId = reqBodyValues[1]
    reqOrderId = reqBodyValues[2]
    var reqTotalValue = reqBodyValues[3]

    getOrderDoc().then(() => {
        if(orderDoc == null){
            const order = new orderModel({
                orderId: reqOrderId,
                partnerId: reqPartnerId,
                userId: reqUserId,
                totalValue: reqTotalValue,
                paidValue: 0,
                paymentsNumber: 0,
                status: 'fresh'
            })
            order.save().then(() => {
                res.status(201).send()
            })
        } else {
            res.status(200).send(orderDoc)
        }
    })
}

export function updateOrder(req, res) {
    res.send("/order update ok")
}

async function getOrderDoc(){
    orderDoc = await orderModel.findOne({orderId: reqOrderId}).lean()
}
