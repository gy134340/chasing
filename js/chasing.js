/**
 * 利用canvas读取摄像头media，进行处理获得用来检测场景的变化，并获取变化位置，存储变化的场景图片
 * @author gy
 */

var video = document.getElementById("e_video");
videoEnable( video );
var canvas = document.getElementById("e_canvas");
var ctx = canvas.getContext('2d');

var ANIMATION;		
var SUSPEND = false;		
var DIRECTION = "left";		// 移动物体进来的方向,需要保持一个方向
var CAPTURE = true;			
var PARTICLE = document.querySelectorAll(".particle")[0];
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

var lastImageData;
var sourceImageData;

var blendCanvas =  document.getElementById("blend_canvas");	
var blendCtx = blendCanvas.getContext('2d');
var content = document.querySelectorAll('.content')[0];
var canvasImage = document.getElementById('canvas_image');

var start = document.getElementById("start");
var stop = document.getElementById("stop");

document.addEventListener('DOMContentLoaded',function(){

	start.addEventListener('click',function(){
		animate();
	},false);

	start.click(); 		// trigger start @todo 
},false);

// 结束动画
stop.addEventListener('click',function(){
	window.cancelAnimationFrame( ANIMATION );
	resumeContent();	// 将content内容恢复到原始状态
},false);

var frame = 0;		// 纪录第几帧,可能会用到

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

addAtoms(2000);
var atoms = document.querySelectorAll(".atom");
var atomsLen = atoms.length;

function render(){
	var imgData = ctx.getImageData(0,0,canvasWidth,canvasHeight);
	var blendData = blendCtx.createImageData(canvasWidth,canvasHeight);

	sourceImageData = imgData;
	if(!lastImageData){
		lastImageData = sourceImageData;
	}
	var dataLen = imgData.data.length;

	imgToBw(blendData.data,imgData.data,lastImageData.data);
	
	lastImageData = sourceImageData;
	blendCtx.putImageData(blendData,0,0);

	getPosition();
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
	var poi = { max:0, xAxis:0 };
	var totalPixel = 0;
	
	// @todo 相加同一x坐标点来检测行人
	for(var i = 0; i < canvasWidth; i += 5){
		var sliceData =  blendCtx.getImageData(i,0,20,canvasHeight);
		var sum = 0;
		var sliceLen = sliceData.data.length;
		for(var j = 0; j < sliceLen; j+=4){

			// sum += sliceData.data[j] + sliceData.data[j+1] + sliceData.data[j+2];
			sum += (sliceData.data[j] & 1 );		// 取符号位即可，rgb值一样,取一个值即可
		}
		if(poi.max < sum){
			poi.max = sum;
			poi.xAxis = i;		// 摄像头与canvas场景需要倒置
		}

		totalPixel += sum;
	}

	moveParticle(poi); 
	captureImage(totalPixel);				
}

// 移动小黑块 @todo 太小的移动速度不管
function moveParticle(p){
	var poi = p;

	// 切片中改变像素的数量
	if(poi.max > 500 && SUSPEND === false){		
		var xRatio = poi.xAxis / canvasWidth;
		xRatio = xRatio.toFixed(2) * 100;
		var left = parseInt(PARTICLE.style.left) || 0;

		var direction = left - xRatio;
		direction = direction.toFixed(0);
		var absSpace = fastAbs(direction);

		// if(absSpace > 20 && absSpace < 40){		// 误差处理,移动过快纠正
		// 	correctDeviation();					// 最快1.5s执行一次
		// 	return false;						// stop here
		// }

		if(absSpace > 60){			// 纠正 人从左边进入还是从右边进入
			correctEntrance(left);
			return false;			// stop here
		}	

		if(correctDirection(direction,left) == false){		// 纠正左右快速移动误差
			return false;
		}

		if(absSpace > 2){		// 误差处理，移动过慢就不处理
			if(left < xRatio){					// 右移
				if(left > 85){
					PARTICLE.style.left = 100 + "%";
					DIRECTION == "left";
					return false;
				}

				for(var offset = left; offset < xRatio; offset++){
					PARTICLE.style.left = offset + "%";
					spreadAtoms(offset);
				}
			}else{					// 左移
				if(left < 15){					
					PARTICLE.style.left = 0 + "%";
					DIRECTION == "right";
					return false;
				}							
 				for(var offset = left; offset > xRatio; offset--){
					PARTICLE.style.left = offset + "%";
					spreadAtoms(offset);
				}
			}	
		}
				
	}	
}

// 人的进入方向纠正
function correctEntrance(l){
	var left = l;
	if(left < 15){
		SUSPEND = true;			
		PARTICLE.style.display = "none";
		PARTICLE.style.left = 100 + "%";

		setTimeout(function(){
			SUSPEND = false;
			PARTICLE.style.display = "block";
		},1000);		

	}else if(left > 85){
		SUSPEND = true;			
		PARTICLE.style.display = "none";
		PARTICLE.style.left = 0 + "%";

		setTimeout(function(){
			SUSPEND = false;
			PARTICLE.style.display = "block";
		},1000);	
	}

}

// 纠正快速微小的左右移动
// @des 如果上一场景与这一场景移动方向不一致
function correctDirection(dir){

	// if(DIRECTION == "left" ){
	// 	if(dir > 0){
	// 		return false;
	// 	}
	// }else if(DIRECTION == "right"){
	// 	// console.log("dir",dir);
	// 	if(dir < 0){
	// 		return false;
	// 	}
	// }

}

// 纠正过快移动
// function correctDeviation(){
// 	SUSPEND = true;			// 暂停1.5s
// 	setTimeout(function(){
// 		SUSPEND = false;
// 	},1500);

// 	var left = parseInt(PARTICLE.style.left);

// 	// 小于50回到左边，大于50滚回右边
// 	if(left < 50){			
// 		for(var offset = left; offset > 0; offset -= 2){
// 			PARTICLE.style.left = offset + "%";
// 			spreadAtoms(offset);
// 		}
// 		resumeAtoms();
// 	}else{
// 		for(var offset = left; offset < 100; offset += 2){
// 			PARTICLE.style.left = offset + "%";
// 			spreadAtoms(offset);
// 		}
// 		resumeAtoms();
// 	}
// }

function update(){
	ctx.drawImage(video,0,0,canvasWidth,canvasHeight);
}

function animate(){
	update();
	render();	
	// setTimeout(function(){
	// 	animate();
	// },1000);
	ANIMATION = window.requestAnimationFrame(animate);
}

// 取消animation一段时间
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
	// var atoms = document.querySelectorAll(".atom");		// 放在全局作用域内
	// var atomsLen = atoms.length;

	for(var i = 0; i < atomsLen; i++){
		var atom = atoms[i];
		var xPoi =  parseInt(atom.style.left);
		var yPoi = parseInt(atom.style.top);

		var xAbs = fastAbs(xPoi-xRefer);

		if(xAbs < 8){			// 如果距离小于5
			if(yPoi < 50){	
				atom.style.marginTop = - ( yPoi - ( xAbs * 10 ) ) + "px";
			}else{		
				atom.style.marginTop = ( 100 - yPoi ) - ( xAbs * 10) + "px";
			}
		}else{
			atom.style.marginTop = "0px";
		}
	}

}

function resumeContent(){
	PARTICLE.style.left = "0%" ;
	resumeAtoms();
}

function resumeAtoms(){
	// var atoms = document.querySelectorAll(".atom");
	// var atomsLen = atoms.length;

	for(var i = 0; i < atomsLen; i++){
		atoms[i].style.marginTop = "0px";
	}
}



// get image from canvas，暂时不会用到
function captureImage(t){

	if(CAPTURE === true){	
		var totalPixel = t;

		// console.log("totalPixel",totalPixel);
		if(totalPixel > 10000){		// 图像中整体变化的像素点	
			var imgUrl = canvas.toDataURL('image/jpg');
			canvasImage.src = imgUrl;
			recordInfo(canvasImage.src);	

			CAPTURE = false;			// 最多3s取一次图片
			setTimeout(function(){
				CAPTURE = true;
			},3000);
		}
	}
	
}

// 将video源连接到摄像头
function videoEnable(ele){
	var p = navigator.mediaDevices.getUserMedia({ audio: false, video: true });   // 去掉声音
	
	p.then(function(mediaStream) {
		var video = ele;
		video.src = window.URL.createObjectURL(mediaStream);
		video.onloadedmetadata = function(e) {
			console.log("success");
		};
	});
	p.catch(function(err) { 
		console.log(err.name); 
	}); 
}

// 工具函数
// >> 32位右移获得符号位0，－1
// ^ 异或，正数与0，不变，(负数*-1)-1-1
function fastAbs(value){
	return (value ^ (value >> 31)) - (value >> 31);
}

// 根据阈值二值化，可以更改阈值参数
function threshold(value){
	return (value > 0x15) ? 0xFF : 0;
}

// 数据存储
function recordInfo(s){
	var imgSource = s;

	$.ajax({
		type: 'POST',
		url: 'updateRecord.php',
		data: {
			img: imgSource
		},
		async: true,		// 异步即可，不用等回调
		success: function(dt){
			console.log("success record");
		},
		error: function(err){
			console.log("error in record");
		}
	});
}



