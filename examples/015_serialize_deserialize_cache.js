/* 
 * Another important feature of freech-lib-js is the cache. The cache is used extensively 
 * by freech-lib-js to minimize the number of JSON-RPC requests. The Freech object provides 
 * methods that can be used to save the cache (e.g. on hard disk or in the browser's local 
 * storage) and to restore it. In this example we query a post and save the cache to a string. 
 * For that we have set the signature verification mode to instant because unverified posts 
 * are not restored.
 */

Freech = require("../src/Freech.js")

Freech.setup({signatureVerification:"instant"})

var cacheStore = "";

Freech.getUser("martkistdevs").doPost(1,function(post){
    
  console.log("got post. storing cache.")

  cacheStore = JSON.stringify(Freech.serializeCache());
 
});

/* 
 * After a short time (so we can be sure the query went through) we clear the cache, which 
 * we do manually here. To try to extract the post from the cache we use the getPost method, which 
 * only works if the post is in cache. If a post is not in cache the getPost method will 
 * return null and will not issue a query for that post.
 */

setTimeout(function(){

  Freech._userCache = {};
  
  if (Freech.getUser("martkistdevs").getPost(1)==null) {

    console.log("post is gone. cache is empty.")

  }
  
},2000);


/*
 * After another short time we restore the cache and find that the post is back.
 */

setTimeout(function(){

  Freech.deserializeCache(JSON.parse(cacheStore));

  var post = Freech.getUser("martkistdevs").getPost(1);
  
  if (post) {

    console.log("post is back: "+post.getContent())

  }
  
},3000);
