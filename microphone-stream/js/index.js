const WebSocket = require('ws')
const fs = require('fs');
// Parse command line arguements
const arguements = process.argv;
let indexOffile = arguements.indexOf('-f');
let filename = arguements[indexOffile + 1]
let indexOfLang = arguements.indexOf('-l');
let language = arguements[indexOfLang + 1];
const api_key = `f8823360f57f4ec499789a1b2c70f43f`;
// Get file (This example uses a file and internally mocks a stream. i.e simulates chunks of data)
const file = fs.readFileSync(filename);
//Convert to buffer
const buffer = Buffer.from(file)
console.log(`buffer:${buffer}`);
let url = `wss://speech.reverieinc.com/stream?api_key=${api_key}&lang=${language}&domain=generic`;
//Initialize WebSocket
var socket = new WebSocket(url);

//Send chunks to TTS
socket.addEventListener('open', function () {
    let bufferSize = buffer.length;
    let windowSize = 10240;
    let nchunks = bufferSize / windowSize;
    console.log("Sending data")
    for (let i = 0; i < nchunks; i++) {
        let start = i * windowSize;
        let end = start + windowSize;
        end = end > buffer.length ? buffer.length : end;
        let chunk = buffer.slice(start, end);
        //You can send chunks from microphone streaming and pass to the below function
        socket.send(chunk);
    }
    console.log("sending EOF");
    socket.send(Buffer.from("--EOF--"));
});

//Recieve message
socket.addEventListener('message', function (event) {
    let message = JSON.parse(event.data);
    console.log('Message from server ', event.data);
    if (message.final) {
        process.exit(0)
    }
});