import orderModel from '../model/order.model.js'
import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'

import { sendOrderPaidWebhook } from '../services/webhook.service.js';


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

const getParentPartnerDoc = async (partnerId) => {
    return await partnerModel.findOne({ partnerId: partnerId }).lean()
}

const getPartnerDashboardData = async (partnerId) => {
    // Pipeline de Agregação do MongoDB
    const aggregationPipeline = [
        // Estágio 1: Filtrar todos os documentos para o parceiro desejado.
        {
            $match: { partnerId: partnerId }
        },
        // Estágio 2: Usar $facet para executar duas operações em paralelo:
        {
            $facet: {
                // Ramo 1: "metadata" para as estatísticas
                metadata: [
                    {
                        $group: {
                            _id: null, // Agrupar todos os documentos em um só
                            totalValue: { $sum: '$totalValue' },
                            paidValue: { $sum: '$paidValue' },
                            totalOrders: { $sum: 1 }, // Conta 1 para cada documento
                            totalPayers: { $sum: { $size: '$payersIds' } },
                            paidOrders: {
                                $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                            },
                            freshOrders: {
                                $sum: { $cond: [{ $eq: ['$status', 'fresh'] }, 1, 0] }
                            },
                            progressOrders: {
                                $sum: { $cond: [{ $eq: ['$status', 'progress'] }, 1, 0] }
                            }
                        }
                    },
                    {
                        // Remove o campo _id: null do resultado do metadado
                        $project: { _id: 0 }
                    }
                ],
                // Ramo 2: "recentOrders" para a lista
                recentOrders: [
                    { $sort: { createdAt: -1 } }, // Ordena pelas mais recentes
                    // { $limit: 100 }              // Limita a 100 documentos
                ]
            }
        },
        // Estágio 3: Reestruturar o resultado para um formato mais limpo
        {
            $project: {
                // Pega o primeiro (e único) elemento do array 'metadata'
                stats: { $arrayElemAt: ['$metadata', 0] },
                recentOrders: '$recentOrders'
            }
        }
    ];

    const result = await orderModel.aggregate(aggregationPipeline);

    // Se não houver orders para o parceiro, retorna um formato consistente.
    if (result.length === 0) {
        return {
            stats: {
                totalValue: 0,
                paidValue: 0,
                totalOrders: 0,
                totalPayers: 0,
                paidOrders: 0,
                freshOrders: 0,
                progressOrders: 0,
            },
            recentOrders: []
        };
    }

    return result[0];
};

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
        const { name, partnerId, totalValue, apiKey, partnerRefId } = req.body
        
        const partnerDoc = await getPartnerDoc(partnerId)

        
        if (!partnerDoc) {
            return res.status(404).send({ error: "partner doesnt exist" })
        }
        
        if (apiKey !== partnerDoc.apiKey) {
            return res.status(403).send()
        }
        
        const orderId = new mongoose.Types.ObjectId()
        const order = new orderModel({
            name,
            orderId,
            partnerId,
            totalValue,
            paidValue: 0,
            paymentsNumber: 0,
            payersIds: [],
            payersNames: [],
            payersValues: [],
            payersPhone: [],
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
        const [orderId, paidValue, paymentsNumber, payersIds, payersNames, payerValue, adminPassword, payersPhone] = Object.values(req.body);
        
        const orderDoc = await orderModel.findOne({ orderId }).lean();
        if (!orderDoc) {
            return res.status(404).send({ error: "pedido não existe" });
        }
        
        // Proteção para não reprocessar um pedido já pago
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
        
        // Use findOneAndUpdate para pegar o documento atualizado
        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId },
            {
                $inc: { paidValue: paidValue, paymentsNumber: paymentsNumber },
                $push: { payersIds: payersIds, payersNames: payersNames, payersValues: payerValue, payersPhone: payersPhone },
                $set: { status: newStatus }
            },
            { new: true } // Opção para retornar o documento após a atualização
        ).lean();
        
        // DISPARAR O WEBHOOK SE O STATUS FOR 'paid'
        if (updatedOrder.status === 'paid') {
            // Chamada assíncrona, não precisa esperar a conclusão para responder a requisição
            sendOrderPaidWebhook(updatedOrder);
        }
        
        res.status(200).send();
        
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
}
export async function getOrdersByPartner(req, res) {
    try {
        const { partnerId } = req.body;

        if (!partnerId) {
            return res.status(400).send({ message: 'partnerId é obrigatório.' });
        }
        
        const dashboardData = await getPartnerDashboardData(partnerId);
        
        res.status(200).send(dashboardData);
        
    } catch (error) {
        console.error('Erro ao buscar dados do parceiro:', error);
        res.status(500).send({ message: 'Erro interno do servidor.' });
    }
}


