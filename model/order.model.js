import mongoose from 'mongoose'
const { Schema } = mongoose

const orderSchema = new Schema({
    orderId: String,
    partnerId: String,
    userId: String,
    totalValue: Number,
    paidValue: Number,
    paymentsNumber: Number,
    status: ['fresh', 'progress', 'paid']
})


const orderModel = mongoose.model('order', orderSchema)

export default orderModel;
