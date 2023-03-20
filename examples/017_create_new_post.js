/* 
 * Creating new posts requires an active torrent to obtain the current revision number 
 * including the direct messages.
 */


Freech = require("../src/Freech.js");

Freech.loadServerAccounts(function(){
	
	Freech.getAccount("frimbuktu").activateTorrents(function(){
      
      Freech.getAccount("frimbuktu").post(
        "test post from node using freech-lib-js",function(post){

          Freech.getUser("frimbuktu").doStatus(function(){
            console.log(post.getContent())
          });

      });
      
      Freech.getAccount("frimbuktu").reply("martkistdevs",1,
        "test reply from node using freech-lib-js",function(post){
        
          Freech.getUser("frimbuktu").doStatus(function(){
            console.log(post.getContent())
          });

      });
      
      Freech.getAccount("frimbuktu").refreech("martkistdevs",1,function(post){
        
          Freech.getUser("frimbuktu").doStatus(function(){
            
            console.log(post.getRefreechedContent())
            
          });

      });
      
    });

});
