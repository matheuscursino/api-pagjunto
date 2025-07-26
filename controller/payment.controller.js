import axios from 'axios'
import orderModel from '../model/order.model.js'
import { io, emitToRoom, getRoomInfo } from '../main.js';

const PIX_EXPIRY_TIME = 3600

const createAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(process.env.PAGARME_KEY + ':').toString('base64')
})


const updateOrderPayment = async (orderId, paidValue, name) => {
    try {
        const valueInReais = parseFloat(paidValue);
        const orderIdString = orderId.toString();

        console.log(`🔄 Iniciando atualização de pagamento para ordem: ${orderIdString}`);
        console.log(`💰 Valor: R$ ${valueInReais}, Pagador: ${name}`);

        await axios.put(`${process.env.SITE_URL}/v1/order/payments`, {
            orderId: orderIdString,
            paidValue: valueInReais,
            paymentsNumber: 1,
            payersNames: name,
            payerValue: valueInReais,
            adminPassword: process.env.ADMIN_PASSWORD
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


/**
 * Gera um número de CPF aleatório e válido.
 * @returns {string} Uma string com 11 dígitos do CPF.
 */
function generateRandomCpf() {
    const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

    let sum = randomDigits.reduce((acc, digit, index) => acc + digit * (10 - index), 0);
    let firstVerifier = (sum * 10) % 11;
    if (firstVerifier === 10) firstVerifier = 0;
    
    randomDigits.push(firstVerifier);

    sum = randomDigits.reduce((acc, digit, index) => acc + digit * (11 - index), 0);
    let secondVerifier = (sum * 10) % 11;
    if (secondVerifier === 10) secondVerifier = 0;

    randomDigits.push(secondVerifier);

    return randomDigits.join('');
}

function generateRandomPhone() {
    const ddds = [
        11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34,
        35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62,
        63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85,
        86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99
    ];

    const area_code = ddds[Math.floor(Math.random() * ddds.length)].toString();
    const number = '9' + Math.floor(10000000 + Math.random() * 90000000).toString(); 
    return {
        country_code: '55',
        area_code,
        number
    };
}


export async function createPix(req, res) {
    try {
        const { name, amount, orderId } = req.body;

        if (!name || !amount || !orderId) {
            return res.status(400).json({ error: 'Todos os campos, incluindo orderId, são obrigatórios.' });
        }
        
        const randomCpf = generateRandomCpf();
        const randomPhone = generateRandomPhone();

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
                        country_code: randomPhone.country_code, 
                        area_code: randomPhone.area_code, 
                        number: randomPhone.number
                    }
                },
                
                document: randomCpf,
            },
            payments: [
                {
                    payment_method: 'pix',
                    pix: {
                        expires_in: PIX_EXPIRY_TIME 
                    },
                }
            ]
        };

        const response = await axios.post(
            'https://api-sandbox.asaas.com/v3/pix/qrCodes/static',
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