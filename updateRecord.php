<?php
require_once "lib/database.php";

$con = connect();

$img = $_POST['img'];
$imgName = '';

if(strlen($img) > 10){

	$path = './img/upload/';
	$ran = rand(10,100);
	$today = date('YmdHis'); 	//获取时间并赋值给变量 
	$filename = $path.$today.$ran.'.jpg'; //图片的完整路径

	$imgName = $today.$ran.'.jpg';	// 数据库存储字段

	$imgstr = $img;
	$imgdata = substr($imgstr,strpos($imgstr,",") + 1); 		// 以后是数据
	$decodedData = base64_decode($imgdata);
	file_put_contents($filename,$decodedData);

	insertRecord($imgName,$con);
}

// 作用域不重叠
function insertRecord($imgName,$con){
	
	if($con){
		$query =  "INSERT INTO `img` (`img`) VALUES ('".$imgName."')";
		$exc = mysql_query($query);
	}else{
		echo "not conncted";
	}
}



?>
