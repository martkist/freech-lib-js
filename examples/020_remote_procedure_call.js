/* 
 * Queries that are not explicitly supported by freech-lib-js can be carried out through the 
 * RPC method of the Freech object. Its first argument is the method to call, the second an 
 * array of the parameters, the third is a callback that is run with the result and the 
 * fourth argument is a function that is called when an error occures. In the following 
 * example 10 trending hastags are requested from the server.
 */

Freech = require("../src/Freech.js");

Freech.RPC("gettrendinghashtags", [10], function(result){
	
	console.log(result);

},  function(error){
	
	console.log(error);

});