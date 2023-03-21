 /*
 * Similarly to posts (see previous example), we can query other user based 
 * resources such as the profile ...
 * 
 * NOTE: AFAICT there is no Promise-based doProfile() implementation so this won't work
 */

Freech = require("../src/Freech.js")

Freech.getUser("martkistdevs").doProfile().then(function(profile){
    
  console.log("martkistdevs's full name is "+profile.getField("fullname"));

}).catch(function(error){console.log(error)});

Freech.getUser("martkistdevs").doPost(1).then(function(post){
    
	if (post.isRefreech()) {
      console.log("refreech:"+post.getRefreechedContent())
    } else {
      console.log("normal post:"+post.getContent())
    }
      
});