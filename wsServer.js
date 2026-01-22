import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { activeSession } from "./server.js";

dotenv.config()

const wss = new WebSocketServer({ port: 8080 },()=>{
    console.log("ws running on port 3000")
});

wss.on("connection",async function connection(ws , req) {
  
  
  //token extract form the qurerry parameter
  const token = req.url?.split("=")[1]
  console.log(token)
  if(!token){
    ws.send(JSON.stringify({
      event: "ERROR",
      data: {
        message: "Unauthorized or invalid token",
      },
    }));
    ws.close(1000 , "connection closed")
  }
  const user = await jwt.verify(token , process.env.JWT_SECRET)
  console.log(user)
  if(!user){
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Unauthorized or invalid token",
        },
      }),
    );
    ws.close(1000, "connection closed");
  }
  ws.user = { userId: user.userId, role: user.role };

  ws.on("message", function message(data) {
    console.log("received: %s",data);
    const event = JSON.parse(data).event
    const payload = JSON.parse(data).data
    if(event == "ATTENDANCE_MARKED"){
        // console.log(payload)
        // console.log(ws.user.role == "teacher")

        if(ws.user.role != "teacher"){
          ws.send(
            JSON.stringify({
              event: "ERROR",
              data: {
                message: "Forbidden, teacher event only",
              },
            }),
          );
          ws.close();
        }

        const isEmpty = Object.keys(activeSession).length == 0
        if(isEmpty){
          ws.send(
            JSON.stringify({
              event: "ERROR",
              data: {
                message: "No active attendance session",
              },
            }),
          );
          ws.close(1000, "connection closed");
        }
        else{
          const studentId = payload.studentId
          const attendance_status = payload.status
          const newStudent={}
          newStudent[studentId] = attendance_status

          console.log("new student is equal o below")
          console.log(newStudent)
          const newAttendance = {...activeSession.attendance , ...newStudent}
          // console.log(newAttendance)

          activeSession.attendance = newAttendance
          console.log(activeSession)
        }
    }else if (event == "TODAY_SUMMARY") {
    } else if (event == "MY_ATTENDANCE") {
    } else if (event == "DONE") {
    } else {
    }
  
  });

  ws.send("something");
});