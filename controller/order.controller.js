import orderModel from '../model/order.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'


const getOrderDoc = async (orderId) => {
    return await orderModel.findOne({ orderId }).lean()
}

export async function getOrder(req, res) {
    try {
        const { orderId }= req.body
        
        const orderDoc = await getOrderDoc(orderId)
        
        if (!orderDoc) {
            return res.status(404).send({ error: "order doesnt exist" })
        }
        
        res.status(200).send(orderDoc)
    } catch (error) {
        res.status(500).send()
    }
}

export async function createOrder(req, res) {
    try {
        const { name, totalValue, userKey } = req.body
        
        const orderId = new mongoose.Types.ObjectId()
        const order = new orderModel({
            name,
            userKey,
            orderId,
            totalValue,
            paidValue: 0,
            paymentsNumber: 0,
            payersNames: [],
            payersValues: [],
            status: 'fresh'
        })
        
        await order.save()
        res.status(201).send(orderId)
        
    } catch (error) {
        res.status(500).send()
    }
}
export async function updatePaymentsOrder(req, res) {
    try {
        const [orderId, paidValue, paymentsNumber, payersNames, payerValue, adminPassword] = Object.values(req.body);
        
        const orderDoc = await orderModel.findOne({ orderId }).lean();
        if (!orderDoc) {
            return res.status(404).send({ error: "pedido não existe" });
        }
        
        if (orderDoc.status === 'paid') {
            return res.status(200).send({ message: "Pedido já está pago." });
        }

        const adminDoc = await adminModel.findOne({ adminPassword }).lean();
        if (!adminDoc) {
            return res.status(403).send();
        }
        
        const newTotalPaid = Number(orderDoc.paidValue) + Number(paidValue);
        const totalValue = Number(orderDoc.totalValue);
        
        let newStatus = orderDoc.status;
        if (newStatus !== 'paid' && newTotalPaid >= totalValue) {
            newStatus = "paid";
        } else if (newStatus === "fresh") {
            newStatus = "progress";
        }
        
        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId },
            {
                $inc: { paidValue: paidValue, paymentsNumber: paymentsNumber },
                $push: { payersNames: payersNames, payersValues: payerValue },
                $set: { status: newStatus }
            },
            { new: true }
        ).lean();
        
        if (updatedOrder.status === 'paid') {
            sendOrderPaidWebhook(updatedOrder);
        }
        
        res.status(200).send();
        
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
}


