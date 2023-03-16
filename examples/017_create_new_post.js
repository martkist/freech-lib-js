/* 
 * Creating new posts requires an active torrent to obtain the current revision number 
 * including the direct messages.
 */


Freech = require("../src/Freech.js");

Freech.loadServerAccounts(function(){
	
	Freech.getAccount("timbuktu").activateTorrents(function(){
      
      Freech.getAccount("timbuktu").post(
        "test post from node using freech-lib-js",function(post){

          Freech.getUser("timbuktu").doStatus(function(){
            console.log(post.getContent())
          });

      });
      
      Freech.getAccount("timbuktu").reply("martkistdevs",34,
        "test reply from node using freech-lib-js",function(post){
        
          Freech.getUser("timbuktu").doStatus(function(){
            console.log(post.getContent())
          });

      });
      
      Freech.getAccount("timbuktu").refreech("martkistdevs",34,function(post){
        
          Freech.getUser("timbuktu").doStatus(function(){
            
            console.log(post.getRefreechedContent())
            
          });

      });
      
    });

});
