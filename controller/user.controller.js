import userModel from '../model/user.model.js'
var reqUserId;
var userDoc

async function getUserDoc(){
    userDoc = await userModel.findOne({userId: reqUserId}).lean()
}

export function getOrCreateUser(req, res) {
    var reqBodyValues = Object.values(req.body);
    var reqPartnerId = reqBodyValues[0]
    reqUserId = reqBodyValues[1]

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
