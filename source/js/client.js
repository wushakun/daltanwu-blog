'use strict'

var audioInput = document.querySelector("select#audioInput");
var audioOutput = document.querySelector("select#audioOutput");
var videoSource = document.querySelector("select#videoInput");


  var getUserMedia = navigator.webkitGetUserMedia; //Chrome浏览器的方法
    getUserMedia.call(navigator, {
      video:true, // 开启音频
      audio:true  // 开启视频
    }, function(stream){
        console.log(stream); // 成功获取媒体流
    }, function(error){
        //处理媒体流创建失败错误
    });
	
if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
	console.log("mediaDevices is not supported");
}else {
	navigator.mediaDevices.enumerateDevices()
							.then(gotDevices)
							.catch(handleError);
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
	console.log(err.name + " : " + err.message);
}