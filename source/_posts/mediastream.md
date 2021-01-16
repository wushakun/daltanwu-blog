---
title: WebRTC capture audio and video devices
date: 2020-05-10 12:52:34
tags:
    - TCP/IP
---

<html>
	<head>
		<title> WebRTC capture audio and video devices </title>
		
		<style>
				.none{
						-webkit-filter : none;
				}
				
				.blur{
						-webkit-filter : blur(3px);
				}
				
				.grayscale{
						-webkit-filter:grayscale;
				}
				
				.inver{
						-webkit-filter:inver(1);
				}
				
				.sepia{
						-webkit-filter:sepia(1);
				}
		</style>
	</head>
	<body>
		<div>
			<label>audio input device:</label>
			<select id = "audioInput"></select>
		</div>
		<div>
			<label>audio output device:</label>
			<select id = "audioOutput"></select>
		</div>
		<div>
			<label>video input device:</label>
			<select id = "videoInput"></select>
		</div>
		<div>
			<label>Filter:</label>
			<select id = "filter">
				<option value = "none">None</option>
				<option value = "blur">Blur</option>
				<option value = "gray">Gray</option>
				<option value = "invert">Invert</option>
				<option value = "sepia">Sepia</option>					
			</select>
		</div>
		<video autoplay playsinline id = "player"> </video>
		<div>
			<button id = "snapshot"> Take Snapshot </button>
		</div>
		<div>
			<canvas id = "picture"></canvas>
		</div>
		<script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
		<script src="https://www.tkcbzl.cn/js/client1.js"></script>
	</body>
</html>

https://algs4.cs.princeton.edu/11model/