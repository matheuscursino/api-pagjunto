import mongoose from 'mongoose'
const { Schema } = mongoose

const orderSchema = new Schema({
    orderId: mongoose.ObjectId,
    partnerId: String,
    totalValue: Number,
    paidValue: Number,
    paymentsNumber: Number,
    payersIds: Array,
    status: String,
})
orderSchema.set('timestamps', true);

const orderModel = mongoose.model('order', orderSchema)

export default orderModel;
