import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import axios from 'axios'

// Funções auxiliares para buscar documentos
const getPartnerDoc = async (partnerId) => {
    return await partnerModel.findOne({ partnerId }).lean()
}

const getAdminDoc = async (adminPassword) => {
    return await adminModel.findOne({ adminPassword }).lean()
}

const getPartnerDocByEmail = async (email) => {
    return await partnerModel.findOne({ email }).lean()
}

// Função auxiliar para hash de senha
const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) reject(err)
            else resolve(hash)
        })
    })
}

export async function getPartner(req, res) {
    try {
        const { partnerId } = req.body
        
        const partnerDoc = await getPartnerDoc(partnerId)
        
        if (!partnerDoc) {
            return res.status(404).send({ error: "partner doesnt exist" })
        }
        
        res.status(200).send({
            partnerName: partnerDoc.name,
            recipient_id: partnerDoc.recipient_id,
            partnerId: partnerDoc.partnerId,
            apiKey: partnerDoc.apiKey
        })
        
    } catch (error) {
        res.status(500).send()
    }
}

export async function createPartner(req, res) {
    try {
        const { partnerName, email, partnerPassword, adminPassword, recipient_id } = req.body
        
        const adminDoc = await getAdminDoc(adminPassword)
        if (!adminDoc) {
            return res.status(403).send()
        }
        
        const encryptedPassword = await hashPassword(partnerPassword)
        const apiUUID = crypto.randomUUID()
        const partnerId = new mongoose.Types.ObjectId()
        
        const partner = new partnerModel({
            partnerId,
            email,
            password: encryptedPassword,
            name: partnerName,
            apiKey: apiUUID,
            recipient_id,
            role: "partner",
            partnerRef: ""
        })
        
        await partner.save()
        res.status(201).send(partnerId)
        
    } catch (error) {
        res.status(500).send()
    }
}


export async function createEmployee(req, res) {
    try {
        const { partnerName, email, partnerPassword, adminPassword, partnerRefId } = req.body
        
        const adminDoc = await getAdminDoc(adminPassword)
        if (!adminDoc) {
            return res.status(403).send()
        }
        
        const encryptedPassword = await hashPassword(partnerPassword)
        const apiUUID = crypto.randomUUID()
        const partnerId = new mongoose.Types.ObjectId()
        
        const partner = new partnerModel({
            partnerId,
            email,
            password: encryptedPassword,
            name: partnerName,
            apiKey: apiUUID,
            recipient_id,
            role: "employee",
            partnerRef: partnerRefId
        })
        
        await partner.save()
        res.status(201).send(partnerId)
        
    } catch (error) {
        res.status(500).send()
    }
}

export async function getPartnerByEmail(req, res) {
    try {
        const { email } = req.body
        
        const partnerDoc = await getPartnerDocByEmail(email)
        
        if (!partnerDoc) {
            return res.status(404).send()
        }
        
        res.status(200).send({
            partnerId: partnerDoc.partnerId,
            password: partnerDoc.password
        })
        
    } catch (error) {
        res.status(500).send()
    }
}

export async function getPartnerBalance(req, res) {
    try {
        const { recipient_id } = req.body
        
        const response = await axios.get(
            `https://api.pagar.me/core/v5/recipients/${recipient_id}/balance`,
            {
                headers: {
                    Authorization: 'Basic ' + Buffer.from(process.env.PAGARME_KEY).toString('base64')
                }
            }
        )
        
        const data = response.data
        res.status(200).json({ data })
        
    } catch (error) {
        console.error('Erro ao consultar status:', error.response?.data || error.message)
        res.status(500).json({ error: 'Erro ao consultar balance do recipient' })
    }
}

export async function updateWebhookUrl(req, res) {
    try {
        const { partnerId, apiKey, webhookUrl } = req.body;

        // Validação básica
        if (!partnerId || !apiKey) {
            return res.status(401).json({ message: 'Autenticação necessária.' });
        }

        // Autenticar parceiro
        const partner = await partnerModel.findOne({ partnerId: partnerId, apiKey: apiKey });
        if (!partner) {
            return res.status(403).json({ message: 'Parceiro ou apiKey inválida.' });
        }

        // Validação simples da URL (pode ser mais robusta)
        if (webhookUrl && !webhookUrl.startsWith('http')) {
            return res.status(400).json({ message: 'URL do webhook inválida.' });
        }
        
        // Atualizar a URL no banco
        partner.webhookUrl = webhookUrl;
        await partner.save();

        res.status(200).json({ message: 'URL do webhook atualizada com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar URL do webhook:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}