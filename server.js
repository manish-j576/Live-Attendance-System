import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import { connectDB, User } from "./db.js"
import mongoose from "mongoose"
import z, { email } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { auth } from "./authmiddleware.js"
dotenv.config()
const app = express()
app.use(bodyParser.json())// body parser 
async function main () {
    console.log("app running")
    
    await connectDB()
    const signupRequest = z.object({
        name : z.string(),
        email : z.email(),
        password : z.string().min(6),
        role : z.string("teacher" | "student")
    })

const loginRequestSchema = z.object({
    email: z.email(),
    password : z.string().min(6)
    })
// signup endpoint 
app.post("/auth/signup",async (req,res)=>{

    console.log("signup endpoint hit")
    try{
        // parse the data with zod
        const data = signupRequest.parse(req.body)
        
        
        console.log("control reacheds herr")
        const {name , email , password , role } = data
        console.log("control reacheds herr 2")
        
        // find the user in the db 
        const user = await User.findOne({
            email
        })
        console.log("control reacheds herr 3")
        if(user) {
            console.log("user already exist")
            return res.status(400).json({
                success: false,
                error: "Email already exists",
            });
        }
        console.log("control reacheds herr 4")
        
        //hash the password in using bcrypt
        const hashedPassword = await bcrypt.hash(password , Number(process.env.SALT_ROUNDS))
        console.log("control reacheds herr 5")
        
        // if not found create entry in the db
        const response = await User.create({
            name,
            email,
            password : hashedPassword,
            role
        })
        console.log("control reacheds herr 6")
        
        
        
        // return the response after creating the user
        return res.status(201).json({
            success : true,
            data : {
                id : response._id,
                name  : response.name,
                email : response.email,
                role : response.role
            }
        }) 
        
        
    }catch(error){ 
        console.log("control reacheds herr 7")
        console.log(error)
        return res.status(400).json({
            success: false,
            error: "Invalid request schema",
        });
    }
})

app.post("/auth/login",async (req, res) =>{
    
    try{
        
        // check the zod schema
        const data = loginRequestSchema.parse(req.body)
        
        const {email , password } = data
        
        // make the db call and find the user
        const user = await User.findOne({
            email
        })
        
        // if not found return with the user not found error
        if(!user){
            return res.status(404).json({
                success: false, 
                error : "User not found"
                
            })
        }
        
        
        // if ifound check for the password
        const isMatch = await bcrypt.compare(password , user.password )
        // return the response if the password is incorrect
        if(!isMatch){
            return res.status(400).json({
                success: false,
                error: "Invalid email or password",
            });
        }
        
        // if correct signs a jwt and return to the user 
        const token = jwt.sign({
            userId : user._id,
            role : user.role
        },process.env.JWT_SECRET)
        
        return res.json({
            success : true,
            data  : {
                token : token
            }
        })
    }catch(error){


        console.log("error occured")
        console.log(error)

        return res.status(400).json({
          success: false,
          error: "Invalid request schema",
        });
    }
})

app.get("/auth/me" ,auth ,async  (req , res) =>{
    console.log("get end point ")
    const user = await User.findOne({
        "_id" : req.userId
    })


    return res.json({
        success : true,
        data : {
            _id : user._id,
            name : user.name,
            email : user.email,
            role : user.role
        }
    })})

app.listen(process.env.PORT)


}

main()