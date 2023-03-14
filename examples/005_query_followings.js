 /*
 * ... or the followings of a user. The callback argument of the doFollowings(...) 
 * function is an array of user objects. Therefore we can use those to query their 
 * full names again. For users who's profile is not available on the DHT freech-lib-js
 * will run the internal error function which defaults to console logging. More about 
 * error handling in the next example.
 */

Freech = require("../src/Freech.js")

Freech.getUser("martkistdevs").doFollowings(function(followings){
    
  console.log("the full names of martkistdevs followings are:");
  
  for(var i in followings) {

    followings[i].doProfile(function(profile){

      if (profile.getField("fullname")) {
      
        console.log("fullname: "+profile.getField("fullname"));
      
      } else {

        console.log("no fullname available for "+profile.getUsername());

      }

    });

  }

});