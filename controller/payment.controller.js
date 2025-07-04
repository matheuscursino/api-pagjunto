import axios from 'axios'

// Constantes para configuração
const PIX_EXPIRY_TIME = 3600
const PLATFORM_FEE_PERCENTAGE = 0.01
const PARTNER_PERCENTAGE = 0.99

// Função auxiliar para criar headers de autenticação
const createAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(process.env.PAGARME_KEY).toString('base64')
})

// Função auxiliar para converter valor para centavos
const toCents = (amount) => Math.round(Number(amount) * 100)

// Função auxiliar para criar payload de split
const createSplitPayload = (amount, recipientId) => [
    {
        amount: toCents(amount) * PARTNER_PERCENTAGE,
        recipient_id: recipientId,
        type: "flat"
    },
    {
        amount: toCents(amount) * PLATFORM_FEE_PERCENTAGE,
        recipient_id: process.env.RECEBEDOR_PLATAFORMA_ID,
        type: "flat",
        options: {
            charge_remainder_fee: true,
            charge_processing_fee: true,
            liable: true
        }
    }
]

// Função auxiliar para atualizar pagamento
const updateOrderPayment = async (orderId, paidValue, payerId, payerName) => {
    try {
        await axios.put('https://api.pagjunto.com/order/payments', {
            orderId,
            paidValue,
            paymentsNumber: 1,
            payersIds: payerId,
            payersNames: payerName,
            adminPassword: process.env.ADMIN_PASSWORD
        })
    } catch (error) {
        console.error('Erro ao atualizar pagamento:', error.response?.data || error.message)
    }
}

export async function createPix(req, res) {
    try {
        const { cpf, amount, recipient_id } = req.body

        if (!cpf || !amount) {
            return res.status(400).json({ error: 'CPF e valor são obrigatórios.' })
        }

        const orderPayload = {
            reference_id: `order-${Date.now()}`,
            items: [
                {
                    name: 'Pagamento Pix',
                    quantity: 1,
                    description: "pagamento",
                    amount: toCents(amount)
                }
            ],
            customer: {
                name: 'Cliente do Pix',
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
        const { charge_id, orderId, payerId, paidValue, payerName } = req.params

        const response = await axios.get(
            `https://api.pagar.me/core/v5/charges/${charge_id}`,
            { headers: createAuthHeaders() }
        )

        const status = response.data.status

        if (status === 'paid') {
            await updateOrderPayment(orderId, paidValue, payerId, payerName)
        }

        res.status(200).json({ status })

    } catch (error) {
        console.error('Erro ao consultar status:', error.response?.data || error.message)
        res.status(500).json({ error: 'Erro ao consultar status do pagamento' })
    }
}