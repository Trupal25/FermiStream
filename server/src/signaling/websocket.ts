import { error } from "console"
import { WebSocket, WebSocketServer } from "ws"

const wss = new WebSocketServer({port:8000})

wss.on('connection', function connection(ws){

    ws.on('error',()=>{
        console.log(error)
    })

    console.log("connected to ws server")
    ws.on('message',(message)=>{
        console.log(message.toString())
    })

    ws.send("sometihn")
})
