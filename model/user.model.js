import mongoose from 'mongoose'
const { Schema } = mongoose

const userSchema = new Schema({
    userId: String,
    partnerId: String
})


const userModel = mongoose.model('user', userSchema)

export default userModel;
