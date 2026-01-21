import dotenv from "dotenv"
import mongoose, { Schema }  from "mongoose";
dotenv.config()

export const connectDB =async () => {
    await mongoose.connect(process.env.DATABASE_URL)
    console.log("Database connected successfully")
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  role: { type: String, required: true, enum: ["teacher", "student"] },
});

const ClassSchema = new Schema({
  className: String,
  teacherId: mongoose.ObjectId, // reference to User
  studentIds: {
    type: [String],
    ref: "User", // optional but recommended if you will populate
    default: [],
  }, // array of User references
});

const AttendanceSchema = new Schema({
  classId: mongoose.ObjectId,
  studentId: mongoose.ObjectId,
  status:  { type: String, required: true, enum: ["present", "absent"]}
});


export const User = mongoose.model("User" , UserSchema)

export const Class = mongoose.model("Class" , ClassSchema)

export const Attendance = mongoose.model("Attendance" , AttendanceSchema)