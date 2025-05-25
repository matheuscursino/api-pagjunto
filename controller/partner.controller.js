import partnerModel from '../model/partner.model.js'
import mongoose from 'mongoose'

var partnerDoc;
var reqPartnerId;

async function getPartnerDoc(){
    partnerDoc = await partnerModel.findOne({partnerId: reqPartnerId}).lean()
}

export function getPartner(req, res) {
    var reqBodyValues = Object.values(req.body);
    reqPartnerId = reqBodyValues[0]

    getPartnerDoc().then(() => {
        if(partnerDoc == null){
            res.status(404).send()
        } else {
            res.status(200).send(partnerDoc)
        }
    })
}

export function createPartner(req, res){
    var reqBodyValues = Object.values(req.body);
    var reqPartnerName = reqBodyValues[0]
    var reqPartnerPassword = reqBodyValues[1]

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
    })
}