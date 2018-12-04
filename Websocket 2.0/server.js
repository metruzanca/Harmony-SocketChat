const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const userList = {};
// - - - - HTTP - - - -

setTerminalTitle("Harmony WebChat Server");

http.createServer(function (req, res) {
    fs.readFile('index.html', function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
}).listen(8080);
console.log('HTTP\tSERVER\t--> Running at port: 8080');

// - - - - SOCKET - - - -

const wss = new WebSocket.Server({ port: 8888, clientTracking: true });
console.log('SOCKET\tSERVER\t--> Running at port: 8888');

// Broadcast to all.
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(ws, req) {
    ws.on('message', function incoming(data) {
        try {
        //console.log(data);
        const message = JSON.parse(data);
        
        let outputMessage;
        const lookUpTable = {
            'message'   : () =>{
                console.log(userList);
                console.log('[' + req.connection.remoteAddress + ']: ' +  message.user.username + ' > ' + message.value)
            },
            'connect'   : () =>{

                userList[message.user.username] = req.connection.remoteAddress;
                if (message.value == 'true') {
                    console.log('\x1b[1;32m%s\x1b[0m', (' --> ' + message.user.username))
                }
                else if (message.value == 'false') {
                    console.log('\x1b[1;31m%s\x1b[0m', (' <-- ' + message.user.username))
                }
                else console.log('error: connection value is invalid'); // TODO: better error handling here.
                //https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
                //https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
            },
            'clientUpdate': () => {
                console.log('\x1b[1;33m%s\x1b[0m', ' - Client Update Prompted. - ');
            },
            'run': () => {
                console.log('\x1b[1;34m%s\x1b[0m', ' - Broadcasting a Command - ');
            }
            
        };
        lookUpTable[message.type]();
        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
        }
        catch(er){
            console.log('\x1b[1;31m%s\x1b[0m', 'Something went wrong:\n', er);
        }
    });
});

let stdin = process.openStdin();
stdin.addListener('data',function (d) {
    //console.log('input: ' + d.toString().trim());
    let input = d.toString().trim();

    // - - - - COMMANDS - - - - 
    if (input.startsWith("sudo")) {
        input = input.substring(5);
        if (input.startsWith("run")) {
            wss.broadcast(doSend(input.substring(4), 'run'));
        }
        if (input.startsWith("clients")) {
            console.log();
        }
    }

    // Broacast
    else wss.broadcast('Server|broadcast|' + input);
});

function doSend(value, type = 'message', username = 'Server', color = '#B400FF') {
    return `{"user":{"username":"${username}","color":"${color}"},"type":"${type}","value":"${value}"}`;
}

function setTerminalTitle(title) {
    process.stdout.write(
        String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
    );
}
