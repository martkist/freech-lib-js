/*
 * The same way as users, post also have resource assigned to them such as retwists ans replies.
 * The following example lists the timestamps and retwists of a given post.
 */

Freech = require("../src/Freech.js");

Freech.getUser("hn").doPost(13670,function(post){
  
  post.doRetwistingPosts(function(retwists){

      console.log("retwists of hn:post13670")
      
      for (var i in retwists) {

        console.log(retwists[i].getTimestamp()+": "+retwists[i].getUsername());

      }

  });

});