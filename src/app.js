import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials:true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({
  extended: true,
  limit:"16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

//import user router
import userRouter from './routes/user.router.js'

// router declaration
app.use("/api/v1/user",userRouter)

export  {app}