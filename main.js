// import xRouter from './routes/x.route.js'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dotenv  from 'dotenv'
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

app.use(bodyParser.urlencoded({
    extended: true
  }))

app.use(bodyParser.json())
app.use(cookieParser())

app.get('/', (req, res) =>  {
    res.send("ok")
})

// app.use('/x', xRouter)

app.listen(port, () => {
    console.log(`server started on port: ${port}`)
})