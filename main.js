import orderRouter from './route/order.route.js'
import partnerRouter from './route/partner.route.js'
import paymentRouter from './route/payment.route.js'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dotenv  from 'dotenv'
import cors from 'cors';


const app = express()
const port = 3000

dotenv.config()

async function main() {
  await mongoose.connect(process.env.MONGO_URL)
}

main().then(()=>{
  console.log('connected with db')
}).catch((err)=>{
  console.log(err)
})

app.use(bodyParser.json())
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
  }))

app.use(cookieParser())

app.get('/', (req, res) =>  {
    res.send("ok")
})

app.use('/order', orderRouter)
app.use('/partner', partnerRouter)
app.use('/payment', paymentRouter)

app.listen(port, () => {
    console.log(`server started on port: ${port}`)
})