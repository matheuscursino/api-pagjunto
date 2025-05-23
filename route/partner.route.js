import express from 'express'
var partnerRouter = express.Router()
import { getPartner, updatePartnerBalance } from '../controller/partner.controller.js'


partnerRouter.get('/', getPartner)
partnerRouter.post('/balance', updatePartnerBalance)

export default partnerRouter;