import mongoose from 'mongoose'
const { Schema } = mongoose

const orderSchema = new Schema({
    name: String,
    orderId: mongoose.ObjectId,
    userKey: String,
    totalValue: Number,
    paidValue: Number,
    paymentsNumber: Number,
    payersNames: Array,
    payersValues: Array,
    pagarmeChargeId: { type: Array, required: false, index: true },
    status: String,
})
orderSchema.set('timestamps', true);

const orderModel = mongoose.model('order', orderSchema)

export default orderModel;