import express from 'express'
var partnerRouter = express.Router()
import { getPartner, createPartner, updatePartnerBalance } from '../controller/partner.controller.js'


partnerRouter.get('/', getPartner)
partnerRouter.post('/', createPartner)
partnerRouter.put('/balance', updatePartnerBalance)

export default partnerRouter;