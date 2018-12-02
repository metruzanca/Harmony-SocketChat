const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

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

const wss = new WebSocket.Server({ port: 8888 });
console.log('SOCKET\tSERVER\t--> Running at port: 8888');

// Broadcast to all.
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        
        //console.log(data);
        const message = JSON.parse(data);

        let outputMessage;
        const lookUpTable = {
            'message'   : () =>{
                console.log(message.user.username + ' > ' + message.value)
            },
            'connect'   : () =>{
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
        };
        lookUpTable[message.type]();
        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
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
