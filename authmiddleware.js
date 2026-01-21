import jwt from "jsonwebtoken"

export async function auth(req, res , next){
    try {

        const token = req.headers.authorization
        const user = jwt.verify(token , process.env.JWT_SECRET)
        req.userID = user.userId
        req.ROLE = user.role
        next()
    }catch(error){
        return res.status(401).json({
          success: false,
          error: "Unauthorized, token missing or invalid",
        });
    }
}

export async function teacherAuth(req, res , next){
    try{
        console.log("teahers auth here")
        const token = req.headers.authorization
        const user = jwt.verify(token , process.env.JWT_SECRET)
        if( user.role != "teacher"){
            return res.status(403).json({
              success: false,
              error: "Forbidden, teacher access required",
            });
        } 

        req.userID = user.userId
        next()

    }catch(error){
        res.status(401).json({
          success: false,
          error: "Unauthorized, token missing or invalid",
        });
    }
}
