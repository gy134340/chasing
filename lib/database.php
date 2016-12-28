<?php
// header("content-type:text/html;charset=utf-8");
// date_default_timezone_set("PRC");

function connect(){
	
	// config database 
	$host = 'localhost';
	$username = 'root';
	$pwd = '';
	$con = mysql_connect($host,$username,$pwd);
	if(!$con){echo 'DB connection failed';}
	mysql_select_db("chasing",$con);
	mysql_query("set names 'utf8'");
	return $con;
}
	
?>
