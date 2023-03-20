/*
 * The following example demonstrates how freech-lib-js internally verifies signatures. 
 * If signature verification is activated (set to either "background" or "instant") 
 * freech-lib-js will try to verify the signatures of all resources queried through 
 * the JSON-RPC. In "background" mode the callback of the query will be run before 
 * the signature is verified to maintain responsiveness. In "instant" mode the callback 
 * of the query is only run after a sucessfull signature verification. In both cases an 
 * unsucesfull signature verification will call errorfunc. Try messing with the signature 
 * and changing the signature verification mode.
 *
 */

Freech = require("../src/Freech.js")

Freech.setup({signatureVerification: "instant"});

var martkistdevs = Freech.getUser("martkistdevs");

var payload = JSON.parse('\
{\
    "sig_userpost":"20768add906caba659a17cde985da0462287430a1a45e4dfab77e03747aef9f9e9311534f9a02ed74ec5bb49863cc2db8343c316cd091f598b99832270159e6d13",\
    "userpost":{"height":12439,"k":6,"msg":"Messing with some codes 😎","n":"martkistdevs","time":1679349708}\
}');

Freech.getUser("martkistdevs")._stream._verifyAndCachePost(payload,function(post){
    
    console.log("callback function: "+post.getContent());

});

