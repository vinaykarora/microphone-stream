//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");
var displayText = document.getElementById("displayText");
var languageCode = document.getElementById("languageCode");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);
const api_key = `<api-key>`;
// const language = 'hi';
var selectedLanguage = '';

var source;
var processor;
let recording = false;

const handleSuccess = (stream) => {
	selectedLanguage = languageCode.options[languageCode.selectedIndex].value;
	let url = `wss://speech.reverieinc.com/stream?api_key=${api_key}&lang=${selectedLanguage}&domain=generic&silence=2`;
	gumStream = stream;
	const context = new AudioContext({ sampleRate: 16000 });
	source = context.createMediaStreamSource(stream);
	processor = context.createScriptProcessor(8192, 1, 1);
	connection = new WebSocket(url);
	connection.onopen = () => {
		processor.onaudioprocess = function (e) {
			if (!recording) {
				return;
			}
			// Do something with the data, e.g. convert it to WAV
			console.log(e)
			var inputBuffer = e.inputBuffer;
			var inputData = inputBuffer.getChannelData(0)
			var buffer = convertFloat32ToInt16(inputData);
			connection.send(buffer);
			const audioTracks = stream.getAudioTracks();
			stream.oninactive = function () {
				console.log('Stream ended');
			};
			window.stream = stream; // make variable available to browser console
		};

		source.connect(processor);
		processor.connect(context.destination);
	};

	connection.onerror = error => {
		console.log(`An error occured: ${error}`)
	};

	connection.onmessage = event => {
		console.log('Message from server ', event.data);
		let message = JSON.parse(event.data);
		displayText.innerText = message.display_text;
		if (message.final) {
			displayText.innerText = !message.display_text ? message.cause : message.display_text;
			connection.close();
			stopRecording()
		}
	};
}

function handleError(error) {
	recordButton.disabled = false;
	stopButton.disabled = true;
	pauseButton.disabled = true
	const errorMessage = 'navigator.MediaDevices.getUserMedia error: ' + error.message + ' ' + error.name;
	console.log(errorMessage);
}

function startRecording() {
	console.log("recordButton clicked");
	recording = true;
	//Initialize WebSocket

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

	var constraints = { audio: true, video: false }

	navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

	/*
	  Disable the record button until we get a success or fail from getUserMedia() 
  */

	recordButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/
}

function pauseRecording() {
	console.log("pauseButton clicked rec.recording=", rec.recording);
	if (rec.recording) {
		//pause
		rec.stop();
		pauseButton.innerHTML = "Resume";
	} else {
		//resume
		rec.record()
		pauseButton.innerHTML = "Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");
	recording = false;
	processor.disconnect();
	source.disconnect();

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	pauseButton.innerHTML = "Pause";
	//stop microphone access
	gumStream.getAudioTracks()[0].stop();
}


const collectRecordingData = () => {
	recorder.requestData();
	setTimeout(collectRecordingData, 500);
}

const addMessageToConsole = message => {
	console.log(message);
}

convertFloat32ToInt16 = (buffer) => {
	l = buffer.length
	buf = new Int16Array(l)
	while (l--) {
		buf[l] = Math.min(1, buffer[l]) * 0x7fff
	}
	return buf.buffer
}