import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import { Class, connectDB, User } from "./db.js"
import z, { email, success } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { auth, teacherAuth} from "./authmiddleware.js"
dotenv.config()
const app = express()
app.use(bodyParser.json())// body parser 



async function main() {
  console.log("app running");

  await connectDB();

  const signupRequest = z.object({
    name: z.string(),
    email: z.email(),
    password: z.string().min(6),
    role: z.string("teacher" | "student"),
  }).strict();

  const loginRequestSchema = z
    .object({
      email: z.email(),
      password: z.string().min(6),
    })
    .strict();

  const classRequestSchema = z
    .object({
      className: z.string(),
    })
    .strict();

    const addStudentRequestSchema = z.object({
        studentId : z.string()
    }).strict()


  // signup endpoint
  app.post("/auth/signup",async (req,res)=>{
      try{
          // parse the data with zod
          const data = signupRequest.parse(req.body)

          const {name , email , password , role } = data

          // find the user in the db
          const user = await User.findOne({
              email
          })

          if(user) {
              return res.status(400).json({
                  success: false,
                  error: "Email already exists",
              });
          }

          //hash the password in using bcrypt
          const hashedPassword = await bcrypt.hash(password , Number(process.env.SALT_ROUNDS))

          // if not found create entry in the db
          const response = await User.create({
              name,
              email,
              password : hashedPassword,
              role
          })

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
          return res.status(400).json({
              success: false,
              error: "Invalid request schema",
          });
      }
  })

  app.post("/auth/login", async (req, res) => {
    try {
      // check the zod schema
      const data = loginRequestSchema.parse(req.body);

      const { email, password } = data;

      // make the db call and find the user
      const user = await User.findOne({
        email,
      });

      // if not found return with the user not found error
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // if ifound check for the password
      const isMatch = await bcrypt.compare(password, user.password);
      // return the response if the password is incorrect
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      // if correct signs a jwt and return to the user
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
      );

      return res.json({
        success: true,
        data: {
          token: token,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
  });

  app.get("/auth/me", auth, async (req, res) => {
    const user = await User.findOne({
      _id: req.userID,
    });

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.post("/class", teacherAuth, async (req, res) => {
    try {
      //zod validation
      const data = classRequestSchema.parse(req.body);

      // classs send request
      const response = await Class.create({
        className: data.className,
        teacherId: req.userID,
        studentIds: [],
      });

      console.log(response);
      return res.status(201).json({
        success: true,
        data: {
          _id: response._id,
          className: response.className,
          teacherId: response.teacherId.toHexString(),
          studentIds: response.studentIds,
        },
      });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
  });

  app.post( "/class/:id/add-student", teacherAuth, async (req, res) => {
    console.log("request in .here");
    try {
      //zod validation
      console.log("1")
      const data = addStudentRequestSchema.parse(req.body);
      console.log("2")
      const classId = req.params.id;
      console.log("3")
      
      const foundClass = await Class.findOne({
          _id: classId,
        });
        console.log("4")
        
        if (!foundClass) {
            return res.status(404).json({
                success: false,
                error: "Class not found",
            });
        }
        console.log("5")
        

        const user = await User.findOne({
            _id : data.studentId
        })


        if(!user || user.role != "student"){
            return res.status(404).json({
              success: false,
              error: "Student not found",
            });
        }
        // if we found the class
        let newStudentId = []
        newStudentId = [...foundClass.studentIds , data.studentId]
        console.log(newStudentId)

        console.log(foundClass)
        console.log("6")
        
        const updatedClass = await Class.updateOne(
          { _id: classId },
          { $addToSet: { studentIds: newStudentId } },
        );
        console.log("7")
        
        // fetch user again 
        const fetchClass = await Class.findOne({
            _id : classId
        })
        console.log(fetchClass)
        console.log("$$$$$$$$$$$$$$$")
        console.log(updatedClass);
        console.log("8")
        return res.status(200).json({
          success: true,
          data: {
            _id: fetchClass._id,
            className: fetchClass.className,
            teacherId: fetchClass.teacherId,
            studentIds: fetchClass.studentIds,
          },
        });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
  });


  app.get("/class/:id",auth, async (req ,res) =>{

    try{
        //ectracted class id from parameter
        const classId = req.params.id
        
        // check in the DB that if the class exist 
        const foundClass = await Class.findOne({
            _id:classId
        })

        if(!foundClass){
            res.status(404).json({
                success: false,
                error: "Class not found",
            });
        }

        const studentDetails = await Promise.all(
          foundClass.studentIds.map(async (studentID) => {
            const userDetail = await User.findOne({ _id: studentID });

            return {
              _id: userDetail._id,
              name: userDetail.name,
              email: userDetail.email,
            };
          }),
        );

        if(req.ROLE == "student"){
            console.log(foundClass.studentIds)
                 const isFoundUser = foundClass.studentIds.find( item => item == req.userID)
                if(!isFoundUser){
                    return res.status(404).json({
                        success : false ,
                        error : "Student not found"
                    })
                }
                 return res.status(200).json({
                    success : true,
                    className : foundClass.className,
                    teacherId : foundClass.teacherId,
                    students : studentDetails
                 })
        }
        else if(req.ROLE == "teacher" & foundClass.teacherId == req.userID)
        {
            return res.status(200).json({
              success: true,
              className: foundClass.className,
              teacherId: foundClass.teacherId,
              students: studentDetails,
            });
        }
        else{
            return res.status(403).json({
              success: false,
              error: "Forbidden, not class teacher",
            });
        }
    }catch(errror){
        console.log(errror)
    }
  })

  app.get("/students" , teacherAuth ,async (req , res ) => {
    try{
        const userDetails = await User.find(
            {role : "student"},
            {_id : 1 , name : 1 , email : 1}
        )
        return res.status(200).json({
            success : true,
            data : userDetails
        })
    }catch(error){
        console.log(error)
    }
  })

app.listen(process.env.PORT);
}
main()