import orderModel from '../model/order.model.js'
import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'

// Funções auxiliares para buscar documentos
const getPartnerDoc = async (partnerId) => {
    return await partnerModel.findOne({ partnerId }).lean()
}

const getOrderDoc = async (orderId) => {
    return await orderModel.findOne({ orderId }).lean()
}

const getAdminDoc = async (adminPassword) => {
    return await adminModel.findOne({ adminPassword }).lean()
}

const getOrdersDocByPartner = async (partnerId) => {
    return await orderModel.find({ partnerId })
                          .sort({ createdAt: -1 })
                          .lean()
}

export async function getOrder(req, res) {
    try {
        const [orderId] = Object.values(req.body)
        
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
        const [partnerId, totalValue, apiKey] = Object.values(req.body)
        
        const partnerDoc = await getPartnerDoc(partnerId)
        
        if (!partnerDoc) {
            return res.status(404).send({ error: "partner doesnt exist" })
        }
        
        if (apiKey !== partnerDoc.apiKey) {
            return res.status(403).send()
        }
        
        const orderId = new mongoose.Types.ObjectId()
        const order = new orderModel({
            orderId,
            partnerId,
            totalValue,
            paidValue: 0,
            paymentsNumber: 0,
            payersIds: [],
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
        const [orderId, paidValue, paymentsNumber, payersIds, adminPassword] = Object.values(req.body)
        
        const orderDoc = await getOrderDoc(orderId)
        if (!orderDoc) {
            return res.status(404).send({ error: "order doesnt exist" })
        }
        
        const adminDoc = await getAdminDoc(adminPassword)
        if (!adminDoc) {
            return res.status(403).send()
        }
        
        // Cálculo do valor total após o pagamento
        const newTotalPaid = Number(orderDoc.paidValue) + Number(paidValue)
        const totalValue = Number(orderDoc.totalValue)
        
        // Determinar o novo status
        let newStatus = orderDoc.status
        if (orderDoc.status === "fresh") {
            newStatus = newTotalPaid === totalValue ? "paid" : "progress"
        } else if (orderDoc.status === "progress" && newTotalPaid === totalValue) {
            newStatus = "paid"
        }
        
        // Atualizar o pedido
        await orderModel.updateOne(
            { orderId },
            {
                $inc: { 
                    paidValue: paidValue, 
                    paymentsNumber: paymentsNumber 
                },
                $push: { payersIds },
                status: newStatus
            }
        )
        
        res.status(200).send()
        
    } catch (error) {
        res.status(500).send()
    }
}

export async function getOrdersByPartner(req, res) {
    try {
        const [partnerId] = Object.values(req.body)
        
        const ordersArray = await getOrdersDocByPartner(partnerId)
        res.status(200).send(ordersArray)
        
    } catch (error) {
        res.status(500).send()
    }
}