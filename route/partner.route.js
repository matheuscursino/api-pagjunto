import express from 'express'
var partnerRouter = express.Router()
import { getPartner, createPartner, getPartnerByEmail, getPartnerBalance, updateWebhookUrl, createEmployee } from '../controller/partner.controller.js'


partnerRouter.get('/', getPartner)
partnerRouter.get('/by-email', getPartnerByEmail)
partnerRouter.post('/', createPartner)
partnerRouter.get('/balance', getPartnerBalance)
partnerRouter.put('/webhook', updateWebhookUrl);
partnerRouter.post('/employee', createEmployee)


export default partnerRouter;