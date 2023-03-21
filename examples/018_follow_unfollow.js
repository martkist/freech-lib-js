/* 
 * Following and unfollowing is also done through the account object.
 */

Freech = require("../src/Freech.js");

Freech.loadServerAccounts(function(){
	
  Freech.getAccount("frimbuktu").activateTorrents(function(){

    Freech.getAccount("frimbuktu").follow("martkistdevs",function(newfollowings){

      console.log("following martkistdevs: ");
      newfollowings.map(function(fol){
        console.log(fol.getUsername())
      });

      Freech.getAccount("frimbuktu").unfollow("martkistdevs",function(newfollowings){

        console.log("not following martkistdevs: ");
        newfollowings.map(function(fol){
          console.log(fol.getUsername())
        });

      });

    });

  });

});

