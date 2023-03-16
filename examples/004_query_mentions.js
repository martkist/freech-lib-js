/*
 * ... the mentions (here, the callback argument is an array of post objects) ...
 */

Freech = require("../src/Freech.js")

Freech.getUser("martkistdevs").doMentions(function(mentions){
  
  for(var i in mentions){

    console.log(mentions[i].getUsername()+": "+mentions[i].getContent());

  }
  
});