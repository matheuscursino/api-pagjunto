import orderRouter from './route/order.route.js'
import partnerRouter from './route/partner.route.js'

import express from 'express'
import subdomain from 'express-subdomain'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dotenv  from 'dotenv'

const app = express()
const port = 80

dotenv.config()

async function main() {
  await mongoose.connect(process.env.MONGO_URL)
}

main().then(()=>{
  console.log('connected with db')
}).catch((err)=>{
  console.log(err)
})

app.use(bodyParser.urlencoded({
    extended: true
  }))

app.use(bodyParser.json())
app.use(cookieParser())

app.get('/', (req, res) =>  {
    res.send("ok")
})

const apiRouter = express.Router()
apiRouter.use('/order', orderRouter)
apiRouter.use('/partner', partnerRouter)
app.use(subdomain('api', apiRouter))



app.listen(port, () => {
    console.log(`server started on port: ${port}`)
})