import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3000 },()=>{
    console.log("ws running on port 3000")
});

wss.on("connection", function connection(ws) {
//   ws.on("error", console.error);
    console.log(ws.url)

    // console.log(ws)
  ws.on("message", function message(data) {
    console.log("received: %s", typeof data);

    ws.send("pong")
  });

  ws.send("something");
});