import mongoose from 'mongoose'
const { Schema } = mongoose

const orderSchema = new Schema({
    orderId: mongoose.ObjectId,
    orderName: String,
    pixKey: String,
    totalValue: Number,
    paidValue: Number,
    payersNames: Array,
    payersValues: Array,
    pixCreationTimestamp: String,
    pixExpirationTime: String,
    chargeId: { type: Array, required: false, index: true },
    status: String,
})
orderSchema.set('timestamps', true);

const orderModel = mongoose.model('order', orderSchema)

export default orderModel;