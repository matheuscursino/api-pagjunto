import mongoose from 'mongoose'
const { Schema } = mongoose

const adminSchema = new Schema({
    adminName: String,
    adminPassword: String
})


const adminModel = mongoose.model('admin', adminSchema)

export default adminModel;
