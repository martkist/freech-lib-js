/* 
 * Following and unfollowing is also done through the account object.
 */

Freech = require("../src/Freech.js");

Freech.loadServerAccounts(function(){
	
  Freech.getAccount("pampalulu").activateTorrents(function(){

    Freech.getAccount("pampalulu").follow("bbc_world",function(newfollowings){

      console.log("following bbc_world: ");
      newfollowings.map(function(fol){
        console.log(fol.getUsername())
      });

      Freech.getAccount("pampalulu").unfollow("bbc_world",function(newfollowings){

        console.log("not following bbc_world: ");
        newfollowings.map(function(fol){
          console.log(fol.getUsername())
        });

      });

    });

  });

});

