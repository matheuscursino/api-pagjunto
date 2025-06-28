import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'


var partnerDoc;
var adminDoc;
var reqPartnerId;
var reqAdminPassword;

async function getPartnerDoc(){
    partnerDoc = await partnerModel.findOne({partnerId: reqPartnerId}).lean()
}

async function getAdminDoc(){
    adminDoc = await adminModel.findOne({adminPassword: reqAdminPassword}).lean()
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
                recipient_id: partnerDoc.recipient_id
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
                    accountBalance: 0,
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

export function updatePartnerBalance(req, res) {
    var reqBodyValues = Object.values(req.body);
    reqPartnerId = reqBodyValues[0]
    var reqAccountBalance = reqBodyValues[1]


    getPartnerDoc().then(() => {
        if(partnerDoc == null){
            res.status(404).send()
        } else {
            partnerModel.updateOne({partnerId: reqPartnerId}, {
                accountBalance: reqAccountBalance,
            }).then(() => {
                res.status(200).send()
            })
        }
    }).catch(() => {
        res.status(500).send()
    })
}