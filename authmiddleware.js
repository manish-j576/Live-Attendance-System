import jwt from "jsonwebtoken"

export async function auth(req, res , next){
    try {

        const token = req.headers.authorization
        const user = jwt.verify(token , process.env.JWT_SECRET)
        next()
    }catch(error){
        return res.status(401).json({
          success: false,
          error: "Unauthorized, token missing or invalid",
        });
    }
}