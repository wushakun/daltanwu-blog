'use strict'

var audioInput = document.querySelector("select#audioInput");
var audioOutput = document.querySelector("select#audioOutput");
var videoSource = document.querySelector("select#videoInput");
var filtersSelect = document.querySelector("select#filter")
var videoplay = document.querySelector("video#player");
var snapshot = document.querySelector("button#snapshot")
var picture = document.querySelector("canvas#picture");


picture.height = 240;
picture.width = 320;

function gotMediaStream(stream){
	videoplay.srcObject = stream;
	return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos){deviceInfos.forEach(function(deviceInfo){
		var option = document.createElement('option');
		option.text = deviceInfo.label;
		option.value = deviceInfo.deviceID;
		if(deviceInfo.kind === 'audioinput'){
			audioInput.appendChild(option);
		}else if(deviceInfo.kind === 'audiooutput')
		{
			audioOutput.appendChild(option);			
		}else if(deviceInfo.kind === 'videoinput')
		{
			videoInput.appendChild(option);
		}	
	});
};

function handleError(err){
	console.log('getUserMedia error:', err);
}

snapshot.onclick = function(){
	picture.className = filtersSelect.value;
	picture.getContext('2d').drawImage(videoplay, 0 ,0, picture.width, picture.height);
}
function start(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    console.log("getUserMedia is not supported");
  }else {
    var deviceId = videoInput.value;
    var constraints = {
      video : {
              width : 640,
              height : 480,
              frameRate : 30
      },
      audio : {
            autoGainControl : true,
            noiseSuppression : true,
            echoCancellation : true
          },
      deviceId : deviceId ? deviceId : undefined
    }
    navigator.mediaDevices.getUserMedia(constraints)
                .then(gotMediaStream)
                .then(gotDevices)
                .catch(handleError);
  }
}

start();
videoSource.onchange = start;
audioInput.onchange = start;
filtersSelect.onchange = function(){
	videoplay.className = filtersSelect.value;
}

