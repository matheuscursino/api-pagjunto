import mongoose from 'mongoose'
const { Schema } = mongoose

const partnerSchema = new Schema({
    partnerId: mongoose.ObjectId,
    password: String,
    name: String,
    accountBalance: Number,
    apiKey: String
})


const partnerModel = mongoose.model('partner', partnerSchema)

export default partnerModel;
