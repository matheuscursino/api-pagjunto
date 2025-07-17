import mongoose from 'mongoose'
const { Schema } = mongoose

const partnerSchema = new Schema({
    partnerId: mongoose.ObjectId,
    password: String,
    name: String,
    apiKey: String,
    recipient_id: String,
    email: String,
    webhookUrl: { 
        type: String, 
        default: '' 
    }, 
    role: String,
    partnerRef: mongoose.ObjectId
})


const partnerModel = mongoose.model('partner', partnerSchema)

export default partnerModel;
