/*
 * Hashtag resources are not assigned to a user. Therefore they are queried directly from 
 * the Freech object.
 */

Freech = require("../src/Freech.js");

Freech.doHashtagPosts("news",function(posts){
  
  for (var i in posts) {
  
    console.log(posts[i].getUsername()+": "+posts[i].getContent());
    
  }
  
});
