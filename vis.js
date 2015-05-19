"use strict";

//#### CANVAS STUFF ####

var c = document.getElementById("visCanvas");
var ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

var centreX = c.width/2;
var centreY = c.height/2;

ctx.font = "30pt Sans";
ctx.textAlign = "center";

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function tick() {
	requestAnimFrame(tick);
	render();
}

function render() {
	ctx.clearRect(0, 0, c.width, c.height);
	var freqData = getFreqData(analyser);
	var len = freqData.length-500;
	var smoothed = new Array(len);
	var smoothing = 5;
	
	for (var i=0; i<len; i++) {
		var total = 0;
		for (var j=0; j<smoothing; j++) {
			total += freqData[i+j] || 0;
		}	
		smoothed[i] = (total/2)/smoothing + 100;
	}
	
	ctx.beginPath();
	ctx.moveTo(centreX, centreY - smoothed[0]);
	
	for (var i=0; i<len; i++) {
		var angle = (Math.PI*i)/len;
		ctx.lineTo(Math.sin(angle)*smoothed[i] + centreX, centreY - Math.cos(angle)*smoothed[i]);
	}
	for (var i=len; i>0; i--) {
		var angle = (Math.PI*i)/len;
		ctx.lineTo(-Math.sin(angle)*smoothed[i] + centreX, centreY - Math.cos(angle)*smoothed[i]);
	}
	
	ctx.closePath();
	ctx.fillStyle = "#000";
	ctx.fill();
	
	ctx.beginPath();
	ctx.arc(centreX, centreY, 100 + smoothed[0]/5, 0, 2*Math.PI, false);
	ctx.fillStyle = "#FFF";
	ctx.fill();
}

ctx.fillText("[Drop files here]", c.width/2, c.height/2);

//#### MISC SETUP ####

var sliders = document.getElementById("sliders");

for (var i=0; i<10; i++) {
	var slider = document.createElement("input");
	slider.type = "range";
	slider.width = "200px";
	slider.min = -15;
	slider.max = 15;
	slider.value = 0;
	slider.style.display = "block";
	slider.onchange = updateFilters;
	sliders.appendChild(slider);
}

//#### FILE HANDLING ####

var fileInput = document.getElementById("fileInput");

fileInput.onchange = function handleFile() {
	var audioFile = fileInput.files[0];

	controls.src = URL.createObjectURL(audioFile);
	controls.type = audioFile.type;

	audioSetup();
}

//#### AUDIO PROCESSING ####

var controls = document.getElementById("controls");

window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

var audioContext = new AudioContext();
var filters = new Array(10);
var analyser;

function audioSetup() {
	var audioBufferSouceNode = audioContext.createMediaElementSource(controls);
	
	analyser = audioContext.createAnalyser();
	
	for (var i=0; i<10; i++) {
		filters[i] = audioContext.createBiquadFilter();
		filters[i].type = "peaking";
		filters[i].frequency.value = (i*i*170)+50;
		filters[i].Q.value = 0.5;
		filters[i].gain.value = 0;
	}
	
	audioBufferSouceNode.connect(filters[0]);
	
	for (var i=0; i<9; i++) {
		filters[i].connect(filters[i+1]);
	}
	    
	filters[9].connect(analyser);
	analyser.connect(audioContext.destination);
	
	audioBufferSouceNode.onended = function() {
		// Do something
	};

	tick();
}

function getFreqData(analyser) {
	var array = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(array);
	return array;
}

function updateFilters() {
	for (var i=0; i<10; i++) {
		filters[9-i].gain.value = -sliders.childNodes[i].value;
	}
}
