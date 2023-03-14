 /*
 * Similarly to posts (see previous example), we can query other user based 
 * resources such as the profile ...
 */

Freech = require("../src/Freech.js")

Freech.getUser("martkistdevs").doProfile(function(profile){
    
  console.log("martkistdev's full name is "+profile.getField("fullname"));

});