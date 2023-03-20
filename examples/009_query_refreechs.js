/*
 * The same way as users, post also have resource assigned to them such as refreechs ans replies.
 * The following example lists the timestamps and refreechs of a given post.
 */

Freech = require("../src/Freech.js");

Freech.getUser("martkistdevs").doPost(1,function(post){
  
  post.doRefreechingPosts(function(refreechs){

      console.log("refreechs of martkistdevs:1")
      
      for (var i in refreechs) {

        console.log(refreechs[i].getTimestamp()+": "+refreechs[i].getUsername());

      }

  });

});