import pagarme from 'pagarme';

export async function createPix(req, res) {
  const { cpf, amount, recipient_id } = req.body;

  if (!cpf || !amount) {
    return res.status(400).json({ error: 'CPF e valor são obrigatórios.' });
  }

  try {
    const client = await pagarme.client.connect({ api_key: process.env.PAGARME_KEY });

    const transaction = await client.transactions.create({
      payment_method: 'pix',
      amount: Math.round(Number(amount) * 100),
      customer: {
        external_id: cpf,
        type: 'individual',
        country: 'br',
        name: 'Cliente do Pix',
        documents: [{ type: 'cpf', number: cpf.replace(/\D/g, '') }],
      },
      split_rules: [
        {
          recipient_id: recipient_id,
          percentage: 99,
          liable: true,
          charge_processing_fee: true,
        },
        {
          recipient_id: process.env.RECEBEDOR_PLATAFORMA_ID,
          percentage: 1,
          liable: false,
          charge_processing_fee: false,
        },
      ],
    });

    return res.status(200).json({
      pix_qr_code: transaction.pix_qr_code,
      pix_expiration_date: transaction.pix_expiration_date,
      pix_url: transaction.pix_qr_code_url,
      transaction_id: transaction.id,
    });

  } catch (error) {
    console.error('Erro ao criar pagamento Pix:', error.response || error);
    return res.status(500).json({ error: 'Erro ao criar pagamento Pix.' });
  }
};