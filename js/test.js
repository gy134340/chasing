// 简单兼容
window.requestAnimationFrame = function(){
	return 	window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function( callback ){
				window.setTimeout(callback,1000/60)
			}
}


// back

var video = document.getElementById("e_video");
videoEnable( video );
var canvas = document.getElementById("e_canvas");
var ctx = canvas.getContext('2d');

// 常量
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var lastImageData;
var sourceImageData;

// 渲染出来的canvas
var blendCanvas =  document.getElementById("blend_canvas");
var blendCtx = blendCanvas.getContext('2d');

document.addEventListener('DOMContentLoaded',function(){
	video.addEventListener('play',function(){
		animate();
	},false);
},false);

var tmp = 0;
var frame = 0;		// 纪录第几帧

// change
function render(){
	var imgData = ctx.getImageData(0,0,canvasWidth,canvasHeight);
	var blendData = blendCtx.createImageData(canvasWidth,canvasHeight);

	sourceImageData = imgData;
	if(!lastImageData){
		lastImageData = sourceImageData;	// 第一帧
	}
	var dataLen = imgData.data.length;

	imgToBw(blendData.data,imgData.data,lastImageData.data);
	

	lastImageData = sourceImageData;		// lastImageData存放上一帧的图像
	blendCtx.putImageData(blendData,0,0);			// imgdata存放将要绘制的图像
}

// 图像二值化
function imgToBw(target,data1,data2){
	if(data1.length != data2.length){
		return null;
	}
	var dataLen = data1.length;
	for(var i=0;i<dataLen;i+=4){
		var average1 = (data1[i] + data1[i+1] + data1[i+2])/3;
		var average2 = (data2[i] + data2[i+1] + data2[i+2])/3;
		var diff = threshold(fastAbs(average1 - average2));
		target[i] = diff;
		target[i+1] = diff;
		target[i+2] = diff;
		target[i+3] = 0xFF;
	}
}
// mix
// function blend(last,fresh){
// 	var lastData = last;
// 	var freshData = fresh;

// 	if(lastData.data.length === freshData.data.length){

// 		var dataLen =  lastData.data.length;
// 		for(var i = 0;i<dataLen;i+=4){
// 			if(lastData.data[i] != freshData.data[i]){
// 				freshData.data[i] = 255-freshData.data[i];
// 				freshData.data[i+1] = 255-freshData.data[i+1];
// 				freshData.data[i+2] = 255-freshData.data[i+2];
// 				freshData.data[i+3] = freshData.data[i+3];
// 			}
// 		}
		
// 		ctx.putImageData(freshData,0,0,0,0,canvasWidth/8,canvasHeight/8);

// 		lastImageData = freshData;	// 更新lastImageData;

// 	}else{
// 		return false;
// 	}
// }


// draw
function update(){
	// if(!lastImageData){
	// 	ctx.drawImage(video,0,0,canvasWidth,canvasHeight);
	// }else{
		// lastImageData = ctx.getImageData(0,0,canvasWidth,canvasHeight);	// 上一帧的数据
		ctx.drawImage(video,0,0,canvasWidth,canvasHeight);
		// var freshImageData = ctx.getImageData(0,0,canvasWidth,canvasHeight);	// 这一帧的数据

		// blend(lastImageData,freshImageData);
	// }

}

// main
function animate(){
	// frame++;
	// console.log("**************"+frame+"*****************");
	update();
	render();	
	// setTimeout(function(){
	// 	animate();
	// },1000);
	window.requestAnimationFrame(animate);
}

// 将video与摄像头连接起来
function videoEnable(ele){

	var p = navigator.mediaDevices.getUserMedia({ audio: true, video: true });
	p.then(function(mediaStream) {
		var video = ele;
		video.src = window.URL.createObjectURL(mediaStream);
		video.onloadedmetadata = function(e) {
			console.log("success");
		};
	});
	p.catch(function(err) { console.log(err.name); }); 
}

// 工具函数
// >> 32位右移获得符号位0，－1
// ^  异或，正数与0，不变，(负数*-1)-1-1
function fastAbs(value) 	
{
	return (value ^ (value >> 31)) - (value >> 31);
}

// 根据阈值二值化
function threshold(value) 
{
	return (value > 0x15) ? 0xFF : 0;
}




// 闪的太快，不好观察
if(lastImageData.data.length == dataLen){
	for(var i=0;i<dataLen;i+=4){
		if(imgData.data[i] != lastImageData.data[i]){
			blendData.data[i] = lastImageData.data[i] - imgData.data[i];
			blendData.data[i+1] = lastImageData.data[i+1] - imgData.data[i+1];
			blendData.data[i+2] = lastImageData.data[i+2] - imgData.data[i+2];
			blendData.data[i+3] = 0xFF;
		}else{
			blendData.data[i] = imgData.data[i];
			blendData.data[i+1] = imgData.data[i+1];
			blendData.data[i+2] = imgData.data[i+2];
			blendData.data[i+3] = 0xFF;
		}	
	}
}




/**
 * 兼容老旧浏览器的video代码
 */

var promisifiedOldGUM = function(constraints) {

	// First get ahold of getUserMedia, if present
	var getUserMedia = (navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia);

	// Some browsers just don't implement it - return a rejected promise with an error
	// to keep a consistent interface
	if(!getUserMedia) {
		return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
	}

	// Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
	return new Promise(function(resolve, reject) {
		getUserMedia.call(navigator, constraints, resolve, reject);
	});
		
}

// Older browsers might not implement mediaDevices at all, so we set an empty object first
if(navigator.mediaDevices === undefined) {
	navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if(navigator.mediaDevices.getUserMedia === undefined) {
	navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
}


/**
 * 来自three.js的案例
 */

// Prefer camera resolution nearest to 1280x720.
var constraints = { audio: true, video: { width: 1280, height: 720 } };

navigator.mediaDevices.getUserMedia(constraints)
.then(function(stream) {
	var video = document.querySelector('video');
	video.src = window.URL.createObjectURL(stream);
	video.onloadedmetadata = function(e) {
		video.play();
	};
})
.catch(function(err) {
	console.log(err.name + ": " + err.message);
});
// test
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

var camvideo = document.getElementById('monitor');

	if (!navigator.getUserMedia) 
	{
		document.getElementById('messageError').innerHTML = 
			'Sorry. <code>navigator.getUserMedia()</code> is not available.';
	}
	navigator.getUserMedia({video: true}, gotStream, noStream);

function gotStream(stream) 
{
	if (window.URL) 
	{   camvideo.src = window.URL.createObjectURL(stream);   } 
	else // Opera
	{   camvideo.src = stream;   }

	camvideo.onerror = function(e) 
	{   stream.stop();   };

	stream.onended = noStream;
}

function noStream(e) 
{
	var msg = 'No camera available.';
	if (e.code == 1) 
	{   msg = 'User denied access to use camera.';   }
	document.getElementById('errorMessage').textContent = msg;
}



// from github



<script>
/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
    Based on http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
// custom global variables
var cube;


	// assign global variables to HTML elements
	var video = document.getElementById( 'monitor' );
	var videoCanvas = document.getElementById( 'videoCanvas' );
	var videoContext = videoCanvas.getContext( '2d' );
	
	var layer2Canvas = document.getElementById( 'layer2' );
	var layer2Context = layer2Canvas.getContext( '2d' );
	
	var blendCanvas  = document.getElementById( "blendCanvas" );
	var blendContext = blendCanvas.getContext('2d');
		
	var messageArea = document.getElementById( "messageArea" );

var buttons;
var lastImageData;


init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(-100,250,100);
	scene.add(light);
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX/FOG
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	
	////////////
	// CUSTOM //
	////////////
	this.colorRed = THREE.ImageUtils.loadTexture( "images/SquareRed.png" );
	this.colorGreen = THREE.ImageUtils.loadTexture( "images/SquareGreen.png" );
	this.colorBlue = THREE.ImageUtils.loadTexture( "images/SquareBlue.png" );
	var cubeGeometry = new THREE.CubeGeometry( 50, 50, 50 );
	this.cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, map: colorRed, emissive: 0x333333 } );
	cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
	cube.position.set(0,26,0);
	//cube.rotation.set(Math.PI / 4, 0, 0);
	
	scene.add(cube);
	
	
	
	
	// VIDEO SET UP
	
	// these changes are permanent
	videoContext.translate(320, 0);
	videoContext.scale(-1, 1);
		
	// background color if no video present
	videoContext.fillStyle = '#005337';
	videoContext.fillRect( 0, 0, videoCanvas.width, videoCanvas.height );				

	buttons = [];
	
	var button1 = new Image();
	button1.src ="images/SquareRed.png";
	var buttonData1 = { name:"red", image:button1, x:320 - 96 - 30, y:10, w:32, h:32 };
	buttons.push( buttonData1 );
	
	var button2 = new Image();
	button2.src ="images/SquareGreen.png";
	var buttonData2 = { name:"green", image:button2, x:320 - 64 - 20, y:10, w:32, h:32 };
	buttons.push( buttonData2 );
	
	var button3 = new Image();
	button3.src ="images/SquareBlue.png";
	var buttonData3 = { name:"blue", image:button3, x:320 - 32 - 10, y:10, w:32, h:32 };
	buttons.push( buttonData3 );
	
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{
	if ( keyboard.pressed("z") ) 
	{ 
		// do something
	}
	
	controls.update();
	stats.update();
	blend();	
	checkAreas();
}

function render() 
{
	renderer.render( scene, camera );
	var delta = clock.getDelta();
	cube.rotation.y += delta;
	
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		// mirror video
		videoContext.drawImage( video, 0, 0, videoCanvas.width, videoCanvas.height );
		for ( var i = 0; i < buttons.length; i++ )
			layer2Context.drawImage( buttons[i].image, buttons[i].x, buttons[i].y, buttons[i].w, buttons[i].h );		
	}
	
}

function blend() 
{
	var width  = videoCanvas.width;
	var height = videoCanvas.height;
	// get current webcam image data
	var sourceData = videoContext.getImageData(0, 0, width, height);
	// create an image if the previous image doesn’t exist
	if (!lastImageData) lastImageData = videoContext.getImageData(0, 0, width, height);
	// create a ImageData instance to receive the blended result
	var blendedData = videoContext.createImageData(width, height);
	// blend the 2 images
	differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
	// draw the result in a canvas
	blendContext.putImageData(blendedData, 0, 0);
	// store the current webcam image
	lastImageData = sourceData;
}
function differenceAccuracy(target, data1, data2) 
{
	if (data1.length != data2.length) return null;
	var i = 0;
	while (i < (data1.length * 0.25)) 
	{
		var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
		var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
		var diff = threshold(fastAbs(average1 - average2));
		target[4*i]   = diff;
		target[4*i+1] = diff;
		target[4*i+2] = diff;
		target[4*i+3] = 0xFF;
		++i;
	}
}
function fastAbs(value) 
{
	return (value ^ (value >> 31)) - (value >> 31);
}
function threshold(value) 
{
	return (value > 0x15) ? 0xFF : 0;
}

// check if white region from blend overlaps area of interest (e.g. triggers)
function checkAreas() 
{
	for (var b = 0; b < buttons.length; b++)
	{
		// get the pixels in a note area from the blended image
		var blendedData = blendContext.getImageData( buttons[b].x, buttons[b].y, buttons[b].w, buttons[b].h );
			
		// calculate the average lightness of the blended data
		var i = 0;
		var sum = 0;
		var countPixels = blendedData.data.length * 0.25;
		while (i < countPixels) 
		{
			sum += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]);
			++i;
		}
		// calculate an average between of the color values of the note area [0-255]
		var average = Math.round(sum / (3 * countPixels));
		if (average > 50) // more than 20% movement detected
		{
			console.log( "Button " + buttons[b].name + " triggered." ); // do stuff
			if (buttons[b].name == "red")
				cubeMaterial.map = colorRed;
			if (buttons[b].name == "green")
				cubeMaterial.map = colorGreen;
			if (buttons[b].name == "blue")
				cubeMaterial.map = colorBlue;
			// messageArea.innerHTML = "Button " + buttons[b].name + " triggered.";
		}
		// console.log("Button " + b + " average " + average);
	}
}

</script>

