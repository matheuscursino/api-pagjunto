import mongoose from 'mongoose'
const { Schema } = mongoose

const orderSchema = new Schema({
    name: String,
    orderId: mongoose.ObjectId,
    partnerId: String,
    totalValue: Number,
    paidValue: Number,
    paymentsNumber: Number,
    payersIds: Array,
    payersNames: Array,
    payersValues: Array,
    payersPhone: Array,
    pagarmeChargeId: { type: Array, required: false, index: true },
    status: String,
    userKey: String
})
orderSchema.set('timestamps', true);

const orderModel = mongoose.model('order', orderSchema)

export default orderModel;