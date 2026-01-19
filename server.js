import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import { connectDB, User } from "./db.js"
import mongoose from "mongoose"
import z, { email } from "zod"

dotenv.config()
const app = express()
app.use(bodyParser.json())// body parser 

connectDB()
const signupRequest = z.object({
    name : z.string(),
    email : z.email(),
    password : z.string(),
    role : z.string("teacher" | "student")
})


// signup endpoint 
app.post("/signup",async (req,res)=>{



    try{

        const data = signupRequest.parse(req.body)
        // console.log(req.body)
        const {name , email , password , role } = req.body
        // parse the data with zod
        
        // find the user in the db 
        const user = await User.findOne({
            email
        })
        if(user) {
            console.log("user already exist")
            res.json({
                success : false,
                error : "User already exist"
            })
        }
        // if not found create entry in the db
        const response =await User.create({
            name,
            email,
            password,
            role
        })

        console.log("User created successfully")
        // return the response after creating the user
        return res.json({
            success : true,
            data : {
                name ,
                email 
            }
        })
    }catch(error){
        return res.json({
            success : false,
            error : error
        })
    }
})

app.post("/login", (req, res) =>{
    const {email , password} = req.body

    // check the zod schema

    // make the db call and find the user

    // if not found return with the user not found error


    // if ifound check for the password

    // if correct signs a jwt and return to the user 

    return res.json({
        success : true,
        data  : {
            message : "user logge din successfully"
        }
    })
})
console.log("app running")
app.listen(process.env.PORT)

