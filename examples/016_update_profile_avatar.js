/* 
 * Updating profile information as well as the avatar is done through the account objects 
 * that are accessiable from the Freech object.
 */


Freech = require("../src/Freech.js");

Freech.loadServerAccounts(function(){

  Freech.getAccount("timbuktu").updateProfileFields(
    {fullName: "New Fullname",test:"test"},function(profile){

      console.log("new profile:",profile.getAllFields())

  });

  Freech.getAccount("timbuktu").updateAvatar(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC'
    ,function(avatar){

      console.log(avatar.getUrl())

  });

});