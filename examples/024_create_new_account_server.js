/*
 * example of creating a new user ready in server wallet
 * note: this leverages a freech-core server to generate 
 * the users key pair, resulting in 
 * 1) the user privkey being stored server side
 * 2) the privkey being returned to the client via http
 */


var FreechLocal =  require("../src/Freech.js");

 FreechLocal.generateServerSideAccount ( 'martkistdevs' , 
	function(result){ 

		console.log( "your priv key : " + result  ); 
	 });
