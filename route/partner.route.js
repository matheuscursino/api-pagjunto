import express from 'express'
var partnerRouter = express.Router()
import { getPartner, createPartner, getPartnerByEmail } from '../controller/partner.controller.js'


partnerRouter.get('/', getPartner)
partnerRouter.get('/by-email', getPartnerByEmail)
partnerRouter.post('/', createPartner)

export default partnerRouter;