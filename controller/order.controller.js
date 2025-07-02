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

const getPartnerDashboardData = async (partnerId) => {
    // Pipeline de Agregação do MongoDB
    const aggregationPipeline = [
        // Estágio 1: Filtrar todos os documentos para o parceiro desejado.
        // Este é o passo mais importante para a performance.
        {
            $match: { partnerId: partnerId }
        },
        // Estágio 2: Usar $facet para executar duas operações em paralelo:
        // 1. Calcular as estatísticas de TODAS as orders filtradas.
        // 2. Obter a lista das 100 mais recentes.
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
                            totalPayers: { $sum: { $size: '$payersIds' } }, // Soma o tamanho de cada array 'payersIds'
                            // Contagem condicional para cada status
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
                    { $limit: 100 }               // Limita a 100 documentos
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

    // A agregação retorna um array. Se não houver orders para o parceiro,
    // o array estará vazio. Nós tratamos isso para retornar um formato consistente.
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
        // Recomendo usar req.params ou req.query para IDs, mas mantendo seu código:
        const { partnerId } = req.body; // Desestruturação é mais limpa

        if (!partnerId) {
            return res.status(400).send({ message: 'partnerId é obrigatório.' });
        }
        
        // Chama a nova função de agregação
        const dashboardData = await getPartnerDashboardData(partnerId);
        
        res.status(200).send(dashboardData);
        
    } catch (error) {
        console.error('Erro ao buscar dados do parceiro:', error); // É bom logar o erro
        res.status(500).send({ message: 'Erro interno do servidor.' });
    }
}