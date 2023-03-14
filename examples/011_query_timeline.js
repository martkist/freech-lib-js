/* 
 * To query the timeline (most recent posts) of user, freech-lib-js brings a utility function called
 * doLatestPostsUntil which is called with a callback function. This callback function will be called 
 * first with the latest post (the status) and then with the rest of the post in time reversed order 
 * (from new to old) as long as the callback function does not return false. If the callback function 
 * returns false the doLatestPostUntil function will stop querying. In the following example the 20 
 * most recent posts of a user are queried and printed out.
 */

Freech = require("../src/Freech.js")

var count = 1

Freech.getUser("avatarx").doLatestPostsUntil(function(post){
	console.log(post.getContent())
    if (count++==20) {return false;}
});