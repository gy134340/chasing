var video = document.getElementById("e_video");
videoEnable( video );
var canvas = document.getElementById("e_canvas");		// 连接视频源的canvas
var ctx = canvas.getContext('2d');

// 常量
var ANIMATION;		// 存储动画，start or stop
var SUSPEND = false;		// 暂停
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var PARTICLE = document.querySelectorAll(".particle")[0];		// 中间移动的小黑块
var lastImageData;		// 上一帧
var sourceImageData;	// 这一帧从canvas上读到的数据

var blendCanvas =  document.getElementById("blend_canvas");		// 渲染出来的canvas
var blendCtx = blendCanvas.getContext('2d');
var content = document.querySelectorAll('.content')[0];			// 主体的页面

var start = document.getElementById("start");		// 开始按钮
var stop = document.getElementById("stop");			// 停止按钮

// 动画开始
document.addEventListener('DOMContentLoaded',function(){

	start.addEventListener('click',function(){
		animate();
	},false);

	start.click(); 		// trigger start @todo 
},false);

// 结束动画
stop.addEventListener('click',function(){
	window.cancelAnimationFrame( ANIMATION );
},false);

var frame = 0;		// 纪录第几帧,可能会用到

// 添加粒子
function addAtoms(num){

	for(var i = 0; i < num; i++){

		var atom = document.createElement("span");
		var xPoi = Math.random().toFixed(2)*100;
		var yPoi = Math.random().toFixed(2)*100;
		atom.className = "atom";
		atom.style.left = xPoi + "%";
		atom.style.top = yPoi + "%";
		content.appendChild(atom);
	}
}

addAtoms(2000);			// 添加许多粒子 

// change
function render(){
	var imgData = ctx.getImageData(0,0,canvasWidth,canvasHeight);
	var blendData = blendCtx.createImageData(canvasWidth,canvasHeight);

	sourceImageData = imgData;
	if(!lastImageData){
		lastImageData = sourceImageData;	// 第一帧时没有上一帧，存储为本帧
	}
	var dataLen = imgData.data.length;

	imgToBw(blendData.data,imgData.data,lastImageData.data);
	
	lastImageData = sourceImageData;		// lastImageData存放上一帧的图像
	blendCtx.putImageData(blendData,0,0);	// imgdata存放将要绘制的图像

	getPosition();							// 检测变化最多的位置
}

// 图像二值化，所有像素点置255，便于下一步统计
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

// 获得像素变化最多位置的坐标
function getPosition(){
	var poi = { max:0, xAxis:0 };		// 变化最多的块
	
	for(var i = 0; i < canvasWidth; i += 15){		// 切分块,对每一个块内变化的像素总量进行判断
		var sliceData =  blendCtx.getImageData(i,0,20,canvasHeight);
		var sum = 0;
		var sliceLen = sliceData.data.length;
		for(var j = 0; j < sliceLen; j+=4){
			// sum += sliceData.data[j] + sliceData.data[j+1] + sliceData.data[j+2];
			sum += (sliceData.data[j] & 1 );		// 取符号位即可，rgb值一样,取一个值即可
		}
		if(poi.max < sum){
			poi.max = sum;
			poi.xAxis = i;
		}	
	}

	moveParticle(poi);  				
}

// 移动小黑块
function moveParticle(p){
	var poi = p;

	if(poi.max > 100){		// 这个值是切片中改变像素的数量，设定一个阈值，改变像素大于这个数时才定
		var xRatio = poi.xAxis / canvasWidth;		// 获得每帧变化最多的位置
		xRatio = xRatio.toFixed(2) * 100;
		var left = parseInt(PARTICLE.style.left) || 0;

		if(SUSPEND == false){		// 是否暂停中

			if(fastAbs(left-xRatio) > 15){	// 误差处理,大于15移动过快不处理
				correctDeviation();

				SUSPEND = true;			// 暂停1.5s
				setTimeout(function(){
					SUSPEND = false;
				},1500);

				return false;
			}
			if(left < xRatio){
				for(var offset = left; offset < xRatio; offset++){
					PARTICLE.style.left = offset + "%";
					spreadAtoms(offset);		// 在移动时扩散周围
				}
			}else{
				for(var offset = left; offset > xRatio; offset--){
					PARTICLE.style.left = offset + "%";
					spreadAtoms(offset);		// 在移动时扩散周围	
				}
			}
		}

		
	}	
}

// 纠正误差 
// @todo do more things here
function correctDeviation(){
	var left = parseInt(PARTICLE.style.left);

	// 小于50回到左边，大于50滚回右边
	if(left < 50){			
		// for(var offset = left; offset > 0; offset -= 2){
		// 	PARTICLE.style.left = offset + "%";
		// 	spreadAtoms(offset);
		// }
		PARTICLE.style.left = 0 + "%";
	}else{
		// for(var offset = left; offset < 100; offset += 2){
		// 	PARTICLE.style.left = offset + "%";
		// 	spreadAtoms(offset);
		// }
		PARTICLE.style.left = 100 + "%";
	}

}

// 取消animation一段时间
// @param t 毫秒
function suspendAnimation(t){
	var time = t;

	window.cancelAnimationFrame(animate);

	setTimeout(function(){
		animate();
	},time);

}

// spread 将周围的小块扩散开来
function spreadAtoms(x){
	var xRefer = parseInt(x);
	var atoms = document.querySelectorAll(".atom");
	var atomsLen = atoms.length;

	for(var i = 0; i < atomsLen; i++){
		var atom = atoms[i];
		var xPoi =  parseInt(atom.style.left);
		var yPoi = parseInt(atom.style.top);

		var xAbs = fastAbs(xPoi-xRefer);

		if(xAbs < 5){			// 如果距离小于5
			// console.log("test",yPoi);
			if(yPoi < 50){				// 横中轴线上半部分
				atom.style.marginTop = - ( yPoi - ( xAbs * 10 ) ) + "px";
			}else{						// 横中轴线下半部分
				atom.style.marginTop = ( 100 - yPoi ) - ( xAbs * 10) + "px";
			}
		}else{
			atom.style.marginTop = "0px";
		}
	}

}

// 从video更新下一帧
function update(){
	ctx.drawImage(video,0,0,canvasWidth,canvasHeight);
}

// main
function animate(){
	update();
	render();	
	// setTimeout(function(){
	// 	animate();
	// },1000);
	ANIMATION = window.requestAnimationFrame(animate);
}

// 将video源连接到摄像头
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

// 根据阈值二值化，可以更改阈值参数
function threshold(value) 
{
	return (value > 0x15) ? 0xFF : 0;
}

