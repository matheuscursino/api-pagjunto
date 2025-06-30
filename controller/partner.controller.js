import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import axios from 'axios'


var partnerDoc;
var partnerDoc2;
var adminDoc;
var reqPartnerId;
var reqAdminPassword;

async function getPartnerDoc(){
    partnerDoc = await partnerModel.findOne({partnerId: reqPartnerId}).lean()
}

async function getAdminDoc(){
    adminDoc = await adminModel.findOne({adminPassword: reqAdminPassword}).lean()
}

async function getPartnerDocEmail(email){
    partnerDoc2 = await partnerModel.findOne({ email: email }).lean()
}

export function getPartner(req, res) {
    var reqBodyValues = Object.values(req.body);
    reqPartnerId = reqBodyValues[0]

    getPartnerDoc().then(() => {
        if(partnerDoc == null){
            res.status(404).send({error: "partner doesnt exist"})
        } else {
            res.status(200).send({
                partnerName: partnerDoc.name,
                recipient_id: partnerDoc.recipient_id,
                partnerId: partnerDoc.partnerId,
                apiKey: partnerDoc.apiKey
            })
        }
    }).catch(() => {
        res.status(500).send()
    })
}

export function createPartner(req, res){
    var reqBodyValues = Object.values(req.body);
    var reqPartnerName = reqBodyValues[0]
    var reqEmail = reqBodyValues[1]
    var reqPartnerPassword = reqBodyValues[2]
    reqAdminPassword = reqBodyValues[3]
    var reqRecipient_id = reqBodyValues[4]
    var encryptedPassword

    bcrypt.hash(reqPartnerPassword, 10, function(err, hash) {
        encryptedPassword = hash

        var apiUUID = crypto.randomUUID();

        getAdminDoc().then(() => {
            if(adminDoc == null){
                res.status(403).send()
            } else {
                var partnerId = new mongoose.Types.ObjectId()
                const partner = new partnerModel({
                    partnerId: partnerId,
                    email: reqEmail,
                    password: encryptedPassword,
                    name: reqPartnerName,
                    apiKey: apiUUID,
                    recipient_id: reqRecipient_id
                })
                partner.save().then(() => {
                    res.status(201).send(partnerId)
                })
            }
        }).catch(() => {
            res.status(500).send()
        })
    });
}

export function getPartnerByEmail(req, res) {
    const { email } = req.body;

    getPartnerDocEmail(email).then(() => {
        if(partnerDoc2 == null){
            res.status(404).send()
        } else{
            res.status(200).send({
                partnerId: partnerDoc2.partnerId,
                password: partnerDoc2.password
            })
        }
    })
    } 

export async function getPartnerBalance(req, res){
    const {recipient_id} = req.body

  try {
    const response = await axios.get(
      `https://api.pagar.me/core/v5/recipients/${recipient_id}/balance`,
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(process.env.PAGARME_KEY).toString('base64')
        }
      }
    );

    const data = response.data;

    res.status(200).json({ data });
  } catch (error) {
    console.error('Erro ao consultar status:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao consultar balance do recipient' });
  }
}
