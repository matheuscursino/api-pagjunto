import userModel from '../model/user.model.js'
import partnerModel from '../model/partner.model.js'

var reqUserId
var reqPartnerId
var userDoc
var partnerDoc

async function getUserDoc(){
    userDoc = await userModel.findOne({userId: reqUserId, partnerId: reqPartnerId}).lean()
}

async function getPartnerDoc(){
    partnerDoc = await partnerModel.findOne({partnerId: reqPartnerId}).lean()
}

export function getOrCreateUser(req, res) {
    var reqBodyValues = Object.values(req.body);
    reqPartnerId = reqBodyValues[0]
    reqUserId = reqBodyValues[1]

    getPartnerDoc().then(() => {
        if(partnerDoc == null){
            res.status(404).send()
        } else {
            getUserDoc().then(() => {
                if(userDoc == null){
                    const user = new userModel({
                        userId: reqUserId,
                        partnerId: reqPartnerId
                    })
                    user.save().then(() => {
                        res.status(201).send()
                    })
                } else {
                    res.status(200).send(userDoc)
                }
            })
        }
    })
}
