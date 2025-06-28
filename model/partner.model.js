import mongoose from 'mongoose'
const { Schema } = mongoose

const partnerSchema = new Schema({
    partnerId: mongoose.ObjectId,
    email: String,
    password: String,
    name: String,
    accountBalance: Number,
    apiKey: String,
    recipient_id: String
})


const partnerModel = mongoose.model('partner', partnerSchema)

export default partnerModel;
