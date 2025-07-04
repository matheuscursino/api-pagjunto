import axios from 'axios'
import orderModel from '../model/order.model.js' // Supondo que você ainda precise disso em outro lugar

// Constantes para configuração
const PIX_EXPIRY_TIME = 3600
const PLATFORM_FEE_PERCENTAGE = 0.01 // 1%
const PARTNER_PERCENTAGE = 1 - PLATFORM_FEE_PERCENTAGE // 99%

// Função auxiliar para criar headers de autenticação
const createAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(process.env.PAGARME_KEY + ':').toString('base64')
})

// Função auxiliar para criar payload de split (CORRIGIDA)
const createSplitPayload = (totalAmountInCents, recipientId) => {
    // Calcula a parte do parceiro e arredonda para baixo para garantir um inteiro
    const partnerAmount = Math.floor(totalAmountInCents * PARTNER_PERCENTAGE);
    
    // A parte da plataforma é o restante, garantindo que a soma seja exata
    const platformAmount = totalAmountInCents - partnerAmount;

    return [
        {
            amount: partnerAmount, // Valor já é um inteiro em centavos
            recipient_id: recipientId,
            type: "flat"
        },
        {
            amount: platformAmount, // Valor já é um inteiro em centavos
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
const updateOrderPayment = async (orderId, paidValue, payerId, name) => {
    try {
        // O valor aqui deve estar em Reais, pois o frontend envia assim para a rota de status
        const valueInReais = parseFloat(paidValue);

        await axios.put('https://api.pagjunto.com/order/payments', {
            orderId,
            paidValue: valueInReais, // Garante que estamos enviando o valor em Reais para o DB
            paymentsNumber: 1,
            payersIds: payerId,
            payersNames: name,
            payersValues: valueInReais,
            adminPassword: process.env.ADMIN_PASSWORD
        })
    } catch (error) {
        console.error('Erro ao atualizar pagamento:', error.response?.data || error.message)
    }
}

export async function createPix(req, res) {
    try {
        // CORRIGIDO: Captura o 'name' e usa o 'amount' como centavos
        const { name, cpf, amount, recipient_id } = req.body

        if (!name || !cpf || !amount) {
            return res.status(400).json({ error: 'Nome, CPF e valor são obrigatórios.' })
        }

        const orderPayload = {
            reference_id: `order-${Date.now()}`,
            items: [
                {
                    name: 'Pagamento Pix',
                    quantity: 1,
                    description: "pagamento",
                    amount: amount // USA O VALOR DIRETAMENTE (JÁ ESTÁ EM CENTAVOS)
                }
            ],
            customer: {
                name: name, // USA O NOME RECEBIDO DO FORMULÁRIO
                email: 'cliente@exemplo.com', // Idealmente, capturar isso também no futuro
                type: 'individual',
                phones: {
                    mobile_phone: { 
                        country_code: '55', 
                        area_code: '12', 
                        number: '991424278' // Idealmente, capturar isso também
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
                    split: createSplitPayload(amount, recipient_id) // Passa o valor em centavos
                }
            ]
        }

        const response = await axios.post(
            'https://api.pagar.me/core/v5/orders',
            orderPayload,
            { headers: createAuthHeaders() }
        )

        const charge = response.data.charges[0]
        return res.status(200).json({ data: charge })

    } catch (error) {
        console.error('Erro ao criar pagamento Pix:', error.response?.data || error.message)
        return res.status(500).json({ error: 'Erro ao criar pagamento Pix.' })
    }
}

export async function getChargeStatus(req, res) {
    try {
        // CORRIGIDO: Captura o 'name' também dos parâmetros
        const { charge_id, orderId, payerId, paidValue, name } = req.params

        const response = await axios.get(
            `https://api.pagar.me/core/v5/charges/${charge_id}`,
            { headers: createAuthHeaders() }
        )

        const status = response.data.status

        if (status === 'paid') {
            // Passa o nome para a função de atualização
            await updateOrderPayment(orderId, paidValue, payerId, name)
        }

        res.status(200).json({ status })

    } catch (error) {
        console.error('Erro ao consultar status:', error.response?.data || error.message)
        res.status(500).json({ error: 'Erro ao consultar status do pagamento' })
    }
}