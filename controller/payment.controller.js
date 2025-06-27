import axios from 'axios';

export async function createPix(req, res) {
  const { cpf, amount, recipient_id } = req.body;

  if (!cpf || !amount) {
    return res.status(400).json({ error: 'CPF e valor são obrigatórios.' });
  }

  try {
    const response = await axios.post(
      'https://api.pagar.me/core/v5/orders',
      {
        reference_id: `order-${Date.now()}`,
        items: [
          {
            name: 'Pagamento Pix',
            quantity: 1,
            description: "pagamento",
            amount: Math.round(Number(amount) * 100)
          }
        ],
        customer: {
          name: 'Cliente do Pix',
          email: 'cliente@exemplo.com',
          type: 'individual',
          phones: {
            mobile_phone: {country_code: '55', area_code: '12', number: '991424278'}
          },
          document: cpf
        },
        payments: [
          {
            payment_method: 'pix',
            pix: {
              expires_in: 3600
            },
             split: [
              {
                amount: Math.round(Number(amount) * 100 * 0.99),
                recipient_id: recipient_id,
                type: "flat"
              },
              {
                amount: Math.round(Number(amount) * 100 * 0.01),
                recipient_id: process.env.RECEBEDOR_PLATAFORMA_ID,
                type: "flat"
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(process.env.PAGARME_KEY).toString('base64')
        }
      }
    );

    const charge = response.data.charges[0];

    return res.status(200).json({
      "data": charge
    });

  } catch (error) {
    console.error('Erro ao criar pagamento Pix:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao criar pagamento Pix.' });
  }
}

export async function getChargeStatus(req, res) {
  const { charge_id } = req.params;
  console.log("polling")

  try {
    const response = await axios.get(
      `https://api.pagar.me/core/v5/charges/${charge_id}`,
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(process.env.PAGARME_KEY).toString('base64')
        }
      }
    );

    const status = response.data.status;

    res.status(200).json({ status });
  } catch (error) {
    console.error('Erro ao consultar status:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao consultar status do pagamento' });
  }
}