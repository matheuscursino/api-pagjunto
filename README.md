# API PagJunto

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-5.x-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)](https://mongoosejs.com/)

API backend do **PagJunto**, uma plataforma de checkout compartilhado. Este serviço gerencia parceiros, pedidos e contribuições Pix; integra-se ao MongoDB, à Pagar.me e ao site PagJunto.

## Repositórios relacionados

- [pagjunto](https://github.com/matheuscursino/pagjunto) — aplicação web em Node.js e EJS.
- [api-pagjunto](https://github.com/matheuscursino/api-pagjunto) — API e servidor Socket.IO deste repositório.

## Requisitos

- Node.js 18 ou superior e npm.
- Uma instância MongoDB acessível.
- Credenciais da Pagar.me e o ID do recebedor da plataforma para processar pagamentos.

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz do projeto. Configure as variáveis abaixo sem publicar os respectivos segredos:

   | Variável | Descrição |
   | --- | --- |
   | `PORT` | Porta HTTP da API e do Socket.IO. |
   | `MONGO_URL` | URI de conexão do MongoDB. |
   | `SITE_URL` | URL base do site PagJunto; usada para CORS do Socket.IO e atualizações internas de pedidos. |
   | `PAGARME_KEY` | Chave de API da Pagar.me. |
   | `RECEBEDOR_PLATAFORMA_ID` | ID do recebedor da taxa da plataforma na Pagar.me. |
   | `ADMIN_PASSWORD` | Senha administrativa usada na atualização interna de pagamentos. |

3. Inicie o servidor:

   ```bash
   npm start
   ```

A API e o Socket.IO iniciam na porta definida em `PORT`. A rota `GET /` responde `ok` para uma verificação simples de disponibilidade.

## Endpoints

As rotas abaixo são relativas à URL base da API. Os endpoints que recebem JSON devem usar `Content-Type: application/json`.

### Pedidos — `/order`

| Método e rota | Descrição |
| --- | --- |
| `POST /order` | Cria um pedido. Requer `name`, `partnerId`, `totalValue` e `apiKey`; `userKey` é opcional. Retorna o `orderId` como string JSON. |
| `GET /order` | Busca um pedido pelo campo `orderId` no corpo JSON. |
| `GET /order/by-partner` | Retorna pedidos e estatísticas do parceiro; recebe `partnerId` no corpo JSON. |
| `PUT /order/payments` | Atualiza valores e pagadores de um pedido. Uso interno do fluxo de pagamento. |

Exemplo de criação:

```json
{
  "name": "Pedido mesa 7",
  "partnerId": "ID_DO_PARCEIRO",
  "totalValue": 150.00,
  "apiKey": "CHAVE_API_DO_PARCEIRO"
}
```

### Parceiros — `/partner`

| Método e rota | Descrição |
| --- | --- |
| `GET /partner` | Busca um parceiro por `partnerId` no corpo JSON. |
| `GET /partner/by-email` | Busca dados de autenticação pelo `email` no corpo JSON. |
| `POST /partner` | Cadastra um parceiro; requer dados do parceiro e `adminPassword`. |
| `GET /partner/balance` | Consulta o saldo de um recebedor Pagar.me; recebe `recipient_id` no corpo JSON. |
| `PUT /partner/webhook` | Configura a URL de webhook do parceiro; requer `partnerId`, `apiKey` e `webhookUrl`. |
| `POST /partner/employee` | Cadastra um funcionário associado a um parceiro. |
| `GET /partner/employee` | Lista funcionários usando `partnerId` como query parameter. |
| `DELETE /partner/employee` | Remove um funcionário usando `employeeId` no corpo JSON. |

### Pagamentos — `/payment`

| Método e rota | Descrição |
| --- | --- |
| `POST /payment/create-pix` | Cria uma cobrança Pix na Pagar.me e associa a cobrança ao pedido. Recebe `name`, `cpf`, `phone`, `amount` em centavos, `recipient_id` e `orderId`. |
| `POST /payment/webhook` | Recebe notificações da Pagar.me. Quando uma cobrança é paga, atualiza o pedido e notifica clientes conectados. Configure esta URL no painel da Pagar.me. |

## Atualizações em tempo real

O Socket.IO compartilha atualizações de pagamento. O cliente deve emitir `joinRoom` com o `orderId` para entrar na sala do pedido. Ao confirmar um pagamento, a API emite o evento `paymentConfirmed` para essa sala.

## Webhooks de pedidos pagos

Quando o pedido atinge o valor total, a API envia um `POST` à URL de webhook configurada para o parceiro. O payload inclui `event: "order.paid"`, dados do pedido e pagadores. A assinatura HMAC-SHA256 do payload é enviada no cabeçalho `X-Pagjunto-Signature-256`, usando a chave de API do parceiro.

