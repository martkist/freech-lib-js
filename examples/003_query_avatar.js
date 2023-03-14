/*
 * ... the avatar ...
 */

Freech = require("../src/Freech.js")

Freech.getUser("martkistdevs").doAvatar(function(avatar){
    
  console.log("martkistdevs avatar url starts with: "+avatar.getUrl().substr(0, 30)+"...");

});