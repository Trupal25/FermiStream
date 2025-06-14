import { WebSocketServer } from "ws"


const wss = new WebSocketServer({port:8000})

wss.on('connection', function connection(ws){

    ws.on('message', function incoming(message) {
        
        

        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

})

