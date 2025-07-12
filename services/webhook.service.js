import axios from 'axios';
import crypto from 'crypto';
import partnerModel from '../model/partner.model.js';

/**
 * Envia um webhook para o parceiro quando um pedido é totalmente pago.
 * @param {object} order - O objeto completo do pedido que foi pago.
 */
export async function sendOrderPaidWebhook(order) {
    if (!order || !order.partnerId) {
        console.error('Tentativa de enviar webhook para um pedido inválido.');
        return;
    }

    try {
        // 1. Buscar os dados do parceiro, incluindo a URL do webhook e a chave secreta (apiKey)
        const partner = await partnerModel.findOne({ partnerId: order.partnerId }).lean()

        // 2. Verificar se o parceiro tem uma URL de webhook configurada
        if (!partner || !partner.webhookUrl) {
            console.log(`Parceiro não possui URL de webhook configurada. Pulando.`);
            return;
        }

        // 3. Montar o payload (os dados que serão enviados)
        const payload = {
            event: 'order.paid',
            orderId: order.orderId,
            partnerId: order.partnerId,
            totalValue: order.totalValue,
            paidValue: order.paidValue,
            status: order.status,
            paidAt: order.updatedAt, // A data em que foi marcado como pago
            payers: order.payersNames.map((name, index) => ({
                name: name,
                value: order.payersValues[index]
            }))
        };
        
        // 4. Assinar o payload com uma chave secreta (usaremos a apiKey do parceiro)
        const secret = partner.apiKey;
        const signature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        // 5. Enviar a requisição POST com o payload e a assinatura no cabeçalho
        console.log(`Enviando webhook para ${partner.webhookUrl} para o pedido ${order.orderId}`);
        await axios.post(partner.webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Pagjunto-Signature-256': signature // Cabeçalho de assinatura customizado
            },
            timeout: 10000 // Timeout de 10 segundos
        });

        console.log(`✅ Webhook para o pedido ${order.orderId} enviado com sucesso.`);

    } catch (error) {
        console.error(`❌ Falha ao enviar webhook para o pedido ${order.orderId}. Erro:`, error.message);
        // Em um sistema de produção, você adicionaria este evento a uma fila de retentativas.
    }
}