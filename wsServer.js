import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { activeSession } from "./server.js";
import { Attendance, Class } from "./db.js";
import { response } from "express";

dotenv.config()

const wss = new WebSocketServer({ port: 3001 },()=>{
    console.log("ws running on port 3001")
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

  ws.on("message", async function message(data) {
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

          
            wss.clients.forEach(function each(client) {
              if (client.readyState === WebSocket.OPEN) {
                const sendPayload = JSON.stringify({
                  event: "ATTENDANCE_MARKED",
                  "data" : newStudent})
                client.send(sendPayload);
              }
            
          });
        }
    }else if (event == "TODAY_SUMMARY") {
      //checks for the teacher role
      if (ws.user.role != "teacher") {
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


      const isEmpty = Object.keys(activeSession).length == 0;
      if (isEmpty) {
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
      const totalStudentCount = Object.keys(activeSession.attendance).length
      const presentStudentArray = Object.values(activeSession.attendance);
      const presentStudentCount = (presentStudentArray.filter(status => status == 'present').length)
      const absentStudentCount = totalStudentCount - presentStudentCount

      wss.clients.forEach( function each(client) {
              if (client.readyState === WebSocket.OPEN) {
                
                
                const responseData = {
                  present : presentStudentCount,
                  absent : absentStudentCount,
                  total : totalStudentCount
                }


                const sendPayload = JSON.stringify({
                  event: "TODAY_SUMMARY",
                  "data" : responseData})


                client.send(sendPayload);
              }
            
          })

      

    } else if (event == "MY_ATTENDANCE") {
        if (ws.user.role != "student") {
          ws.send(
            JSON.stringify({
              event: "ERROR",
              data: {
                message: "Forbidden, student event only",
              },
            }),
          );
          ws.close();
        }

        console.log(ws.user.userId)

        const foundUser = Object.keys(activeSession.attendance).find( studentId  => studentId == ws.user.userId)

        if(foundUser == undefined){
          ws.send(JSON.stringify({
            event: "MY_ATTENDANCE",
            data: {
              status: "not yet updated"
            }}))
        }
        else{
        const attendance_status = activeSession.attendance[foundUser]
        if(attendance_status == "present"){
          ws.send(
            JSON.stringify({
              event: "MY_ATTENDANCE",
              data: {
                status: "present",
              },
            }),
          );
        }else{
          ws.send(
            JSON.stringify({
              event: "MY_ATTENDANCE",
              data: {
                status: "absent",
              },
            }),
          );
        }

      }
    } else if (event == "DONE") {

      //verifies teacher's role
      if (ws.user.role != "teacher") {
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
      const studentIdArray = await Class.find({
        _id : activeSession.classId
      },{studentIds : 1})
      console.log(studentIdArray) // ["studentIds"]
      studentIdArray[0].studentIds.map(async (studentId) => {
        console.log(activeSession.attendance[studentId]);
        if (!activeSession.attendance[studentId]) {
          activeSession.attendance[studentId] = "absent";
        }

        const response = await Attendance.create({ 
            classId: activeSession.classId,
            studentId: studentId,
            status: activeSession.attendance[studentId]
          
        })
      });


      console.log(activeSession)


      if(response){
      const totalStudentCount = Object.keys(activeSession.attendance).length;
      const presentStudentArray = Object.values(activeSession.attendance);
      const presentStudentCount = presentStudentArray.filter(
        (status) => status == "present",
      ).length;
      const absentStudentCount = totalStudentCount - presentStudentCount;

      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          const responseData = {
            message: "Attendance persisted",
            present: presentStudentCount,
            absent: absentStudentCount,
            total: totalStudentCount,
          };

          const sendPayload = JSON.stringify({
            event: "TODAY_SUMMARY",
            data: responseData,
          });

          client.send(sendPayload);
        }
      });

    }


    } else {
      ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: "Invalid Event Type",
          },
        }),
      );
    }
  
  });

  ws.send("something");
});