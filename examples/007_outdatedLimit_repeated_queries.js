/* 
 * When a resource is queried, freech-lib-js will keep this resource in its cache. If the same 
 * resource is then queried a second time, it will first check whether the resource is still 
 * up-to-date. For that it will check whether the last query is longer ago than a query parameter 
 * called "outdatedLimit". This parameter is set in seconds. Like the error function this 
 * parameter can be set either globally...
 */

Freech = require("../src/Freech.js")

Freech.setup({outdatedLimit: 60});

/* 
 * ... or per query.
 */


Freech.getUser("martkistdevs").doStatus(function(post){

  console.log(post.getTimestamp());
    
},{outdatedLimit: 60});

/* 
 * It can also be set per user ....
 */

Freech.getUser("martkistdevs").setQuerySettings({outdatedLimit: 60});


/* 
 * ... or by resource type. The stream resource holds the posts of a user and therefore also 
 * the status. The names of the other resources are: profile, avatar, followings, mentions, 
 * hashtag, pubkey, replies and refreechs.
 */

Freech.setup({
  querySettingsByType:{
    outdatedLimit:{
      stream: 60
    }
  }
});