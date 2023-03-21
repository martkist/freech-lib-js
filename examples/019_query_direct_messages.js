/* 
 * Direct messages can be access through the "doLatestDirectMessagesUntil" function of 
 * an account object. This functions works the same way as the doLatestPostsUntil function 
 * of a user.
 */

Freech = require("../src/Freech.js");

Freech.loadServerAccounts(function(){

	var count=1;
	
	Freech.getAccount("martkistdevs").doLatestDirectMessagesUntil("frimbuktu",function(message){
	
		console.log(message.getSender()+": "+message.getContent());
		if (count++==5) { return false }
		
	})

});