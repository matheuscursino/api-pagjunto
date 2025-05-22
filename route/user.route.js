import express from 'express'
var userRouter = express.Router()
import { getOrCreateUser } from '../controller/user.controller.js'


userRouter.get('/', getOrCreateUser)

export default userRouter;