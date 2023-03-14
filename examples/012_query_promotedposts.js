/*
 * The same can be done with the promoted posts. The equivalent to the user object of the promoted 
 * posts can be accessed from the Freech object through getPromotedPosts().
 */

Freech = require("../src/Freech.js");

var count = 1;

Freech.getPromotedPosts().doLatestPostsUntil(function(post){
    console.log(post.getUsername()+": "+post.getContent());
	if(count++==20) { return false; }
});
