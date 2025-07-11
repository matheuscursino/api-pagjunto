import axios from 'axios'
import orderModel from '../model/order.model.js'
import { io, emitToRoom, getRoomInfo } from '../main.js';

// Constantes para configuração
const PIX_EXPIRY_TIME = 3600
const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%
const PARTNER_PERCENTAGE = 1 - PLATFORM_FEE_PERCENTAGE // 97%

// Função auxiliar para criar headers de autenticação
const createAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(process.env.PAGARME_KEY + ':').toString('base64')
})

// Função auxiliar para criar payload de split
const createSplitPayload = (totalAmountInCents, recipientId) => {
    const partnerAmount = Math.floor(totalAmountInCents * PARTNER_PERCENTAGE);
    const platformAmount = totalAmountInCents - partnerAmount;

    return [
        {
            amount: partnerAmount,
            recipient_id: recipientId,
            type: "flat"
        },
        {
            amount: platformAmount,
            recipient_id: process.env.RECEBEDOR_PLATAFORMA_ID,
            type: "flat",
            options: {
                charge_remainder_fee: true,
                charge_processing_fee: true,
                liable: true
            }
        }
    ];
}

// Função auxiliar para atualizar pagamento
const updateOrderPayment = async (orderId, paidValue, payerId, name, payerPhone) => {
    try {
        const valueInReais = parseFloat(paidValue);
        const orderIdString = orderId.toString();

        console.log(`🔄 Iniciando atualização de pagamento para ordem: ${orderIdString}`);
        console.log(`💰 Valor: R$ ${valueInReais}, Pagador: ${name}, Telefone: ${payerPhone}`);

        // Atualizar o pagamento no banco
        await axios.put(`${process.env.SITE_URL}/order/payments`, {
            orderId: orderIdString,
            paidValue: valueInReais,
            paymentsNumber: 1,
            payersIds: payerId,
            payersNames: name,
            payersValues: valueInReais,
            adminPassword: process.env.ADMIN_PASSWORD,
            payersPhone: payerPhone
        });

        console.log(`✅ Pagamento atualizado no banco para ordem: ${orderIdString}`);

        if (!io) {
            console.error('❌ Socket.IO não está disponível!');
            return false;
        }

        const roomInfo = getRoomInfo(orderIdString);
        if (!roomInfo.exists || roomInfo.clientCount === 0) {
            console.log(`⚠️ Nenhum cliente na sala ${orderIdString} para receber o evento`);
            return false;
        }

        const eventData = {
            message: 'Pagamento confirmado!',
            orderId: orderIdString,
            paidValue: valueInReais,
            payerName: name,
            timestamp: new Date().toISOString()
        };

        const emitSuccess = emitToRoom(orderIdString, 'paymentConfirmed', eventData);
        
        if (emitSuccess) {
            console.log(`✅ Evento 'paymentConfirmed' emitido com sucesso para sala: ${orderIdString}`);
        } else {
            console.log(`❌ Falha ao emitir evento para sala: ${orderIdString}`);
        }

        return true;

    } catch (error) {
        console.error('❌ Erro ao atualizar pagamento:', error.response?.data || error.message);
        return false;
    }
}

export async function createPix(req, res) {
    try {
        // ATENÇÃO: Esta função não foi alterada para receber o telefone do front-end.
        // Ela ainda usa o valor hardcoded como no código original que você forneceu.
        const { name, cpf, amount, recipient_id, orderId } = req.body;

        if (!name || !cpf || !amount || !orderId) {
            return res.status(400).json({ error: 'Todos os campos, incluindo orderId, são obrigatórios.' });
        }

        const orderPayload = {
            reference_id: `order-${Date.now()}`,
            items: [
                {
                    name: 'Pagamento Pix',
                    quantity: 1,
                    description: "pagamento",
                    amount: amount
                }
            ],
            customer: {
                name: name,
                email: 'cliente@exemplo.com',
                type: 'individual',
                phones: {
                    mobile_phone: { 
                        country_code: '55', 
                        area_code: '12', 
                        number: '991424278'
                    }
                },
                document: cpf
            },
            payments: [
                {
                    payment_method: 'pix',
                    pix: {
                        expires_in: PIX_EXPIRY_TIME
                    },
                    split: createSplitPayload(amount, recipient_id)
                }
            ]
        }

        const response = await axios.post(
            'https://api.pagar.me/core/v5/orders',
            orderPayload,
            { headers: createAuthHeaders() }
        );

        const charge = response.data.charges[0];

        if (charge && charge.id) {
            await orderModel.updateOne(
                { orderId: orderId },
                { $push: { pagarmeChargeId: charge.id } }
            );
        }

        return res.status(200).json({ data: charge });

    } catch (error) {
        console.error('Erro ao criar pagamento Pix:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Erro ao criar pagamento Pix.' });
    }
}

export async function getChargeStatus(req, res) {
    try {
        const { charge_id, orderId, payerId, paidValue, name, payerPhone } = req.params

        const response = await axios.get(
            `https://api.pagar.me/core/v5/charges/${charge_id}`,
            { headers: createAuthHeaders() }
        )

        const status = response.data.status

        if (status === 'paid') {
            await updateOrderPayment(orderId, paidValue, payerId, name, payerPhone)
        }

        res.status(200).json({ status })

    } catch (error) {
        console.error('Erro ao consultar status:', error.response?.data || error.message)
        res.status(500).json({ error: 'Erro ao consultar status do pagamento' })
    }
}

export async function handlePagarmeWebhook(req, res) {
    try {
        const { type, data } = req.body;
        console.log('🔔 Webhook recebido:', { type, chargeId: data?.id });

        if (type === 'charge.paid') {
            const chargeId = data.id;
            const order = await orderModel.findOne({ pagarmeChargeId: chargeId });

            if (!order) {
                console.error(`❌ Webhook para chargeId ${chargeId} recebido, mas nenhuma ordem correspondente foi encontrada.`);
                return res.status(404).send('Order not found for this charge.');
            }
            
            if (order.status === 'paid') {
                console.log('⚠️ Ordem já estava paga, ignorando webhook.');
                return res.status(200).send('Order already paid.');
            }

            const paidValueInReais = data.amount / 100;
            const payerId = data.customer?.document || 'N/A';
            const payerName = data.customer?.name || 'N/A';
            const customerPhone = data.customer?.phones?.mobile_phone;
            const payerPhone = customerPhone ? `+${customerPhone.country_code}${customerPhone.area_code}${customerPhone.number}` : 'N/A';

            await updateOrderPayment(order.orderId, paidValueInReais, payerId, payerName, payerPhone);
        }

        res.status(200).send('Webhook processed.');

    } catch (error) {
        console.error('❌ Erro ao processar webhook da Pagar.me:', error);
        res.status(500).send('Internal Server Error');
    }
}