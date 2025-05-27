import partnerModel from '../model/partner.model.js'
import adminModel from '../model/admin.model.js'
import mongoose from 'mongoose'

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
            res.status(404).send()
        } else {
            res.status(200).send()
        }
    }).catch(() => {
        res.status(500).send()
    })
}

export function createPartner(req, res){
    var reqBodyValues = Object.values(req.body);
    var reqPartnerName = reqBodyValues[0]
    var reqPartnerPassword = reqBodyValues[1]
    reqAdminPassword = reqBodyValues[2]

    getAdminDoc().then(() => {
        if(adminDoc == null){
            res.status(403).send()
        } else {
            var partnerId = new mongoose.Types.ObjectId()
            const partner = new partnerModel({
                partnerId: partnerId,
                password: reqPartnerPassword,
                name: reqPartnerName,
                accountBalance: 0
            })
            partner.save().then(() => {
                res.status(201).send(partnerId)
            })
        }
    }).catch(() => {
        res.status(500).send()
    })
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