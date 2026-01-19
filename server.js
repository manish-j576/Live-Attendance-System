import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
dotenv.config()
const app = express()
app.use(bodyParser.json())// body parser 

// signup endpoint 
app.post("/signup",async (req,res)=>{

    // console.log(req.body)
    const {name , email , password , role } = req.body
    // console.log(
    //     name,
    //     email,
    //     password,
    //     role
    // )
    // parse the data with zod

    // find the user in the db 

    // if not found create entry in the db


    // return the response after creating the user


    return res.json({
        success : true,
        data : {
            name ,
            email 
        }
    })
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

