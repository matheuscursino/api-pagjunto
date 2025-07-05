import express from 'express'
var partnerRouter = express.Router()
import { getPartner, createPartner, getPartnerByEmail, getPartnerBalance, handlePagarmeWebhook } from '../controller/partner.controller.js'


partnerRouter.get('/', getPartner)
partnerRouter.get('/by-email', getPartnerByEmail)
partnerRouter.post('/', createPartner)
partnerRouter.get('/balance', getPartnerBalance)
paymentRouter.post('/webhook', handlePagarmeWebhook)

export default partnerRouter;