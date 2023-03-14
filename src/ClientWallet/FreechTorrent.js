//'use strict';

var inherits = require('inherits');
var FreechResource = require('../FreechResource.js');

/**
 * Describes the torrent of the {@link FreechPosts} of a {@link FreechUser} when available on the host. The torrent significantly speeds up post querying time. It is implemented as a look-ahead that is queryied when accessing a post that is not already in cache.
 * @class
 */
FreechTorrent = function (walletusername,name,scope) {
    
  this._hasParentUser = true;

  this._walletusername = walletusername;

  FreechResource.call(this,name,scope);

  this._latestId = -1;
  this._messages = {};
    
  
  this._active = false;
  this._type = "torrent";

}

inherits(FreechTorrent,FreechResource);

module.exports = FreechTorrent;

FreechTorrent.prototype.flatten = function () {

  var flatData = FreechResource.prototype.flatten.call(this);

  flatData.active = this._active;

  return flatData;
    
}

FreechTorrent.prototype.inflate = function (flatData) {

  FreechResource.prototype.inflate.call(this,flatData);

  this._active = flatData.active;

}

FreechTorrent.prototype.trim = function (timestamp) {

  if ( !this._active && (!timestamp || timestamp > this._lastUpdate) ){

    var thisAccount = this._scope.getAccount(this._walletusername);

    delete thisAccount._torrents[this._name];
    
  }

}

FreechTorrent.prototype.activate = function () {
  
  this._active = true;
  var thisStream = Freech.getUser(this._name)._stream;
  thisStream._activeTorrentUser = this._walletusername;

}

FreechTorrent.prototype.deactivate = function () {
  
  this._active = false;
  
  var foundReplacement = false;
  
  for (var username in Freech._wallet){

    if (this._name in Freech._wallet[username]._torrents) {
      if (Freech._wallet[username]._torrents[this._name]._active) {
        Freech.getUser(this._name)._stream._activeTorrentUser=username;
        foundReplacement = true;
      }
    }
  }
  
  if (!foundReplacement) {
    var thisStream = Freech.getUser(this._name)._stream;
    thisStream._activeTorrentUser = null;
  }

}

FreechTorrent.prototype.getQuerySetting = function (setting) {

  //console.log(this._name);

  var Freech = this._scope;

  if (setting in this._activeQuerySettings) {
    return this._activeQuerySettings[setting];
  }

  if (setting in this._querySettings) {
    return this._querySettings[setting];
  }

  if (setting in Freech.getAccount(this._walletusername)._querySettings) {
    return Freech.getAccount(this._walletusername)._querySettings[setting];
  }

  if (setting in Freech.getUser(this._name)._stream._activeQuerySettings) {
    return Freech.getUser(this._name)._stream._activeQuerySettings[setting];
  }

  if (setting in Freech.getUser(this._name)._stream._querySettings) {
    return Freech.getUser(this._name)._stream._querySettings[setting];
  }

  return FreechResource.prototype.getQuerySetting.call(this,setting);

}

FreechTorrent.prototype._queryAndDo = function (cbfunc) {

  var Freech = this._scope;

  var thisTorrent = this;
  
  var thisAccount = Freech.getAccount(this._walletusername);
  
  if (thisTorrent._active) {
    
    thisTorrent._log("locking torrents of same account")
    
    var torrentlist = [];
    
    for (var username in thisAccount._torrents){

      if (thisAccount._torrents[username]._active) {              
        thisAccount._torrents[username]._updateInProgress = true;
        torrentlist.push(username)
      }
      
    }
    
    thisTorrent.RPC("getlasthave", [ "guest", torrentlist ], function(res) {

      if (thisTorrent._name in res) { 

        thisTorrent._active = true ;
        
        thisTorrent._log("updating other torrents based on getlasthave result")
        
        for (var username in res) {
          
          if (username in thisAccount._torrents) {

            var resTorrent = thisAccount._torrents[username];

            if (resTorrent._active) {

              resTorrent._latestId = res[username];       
              resTorrent._lastUpdate = Date.now()/1000;  
              resTorrent._updateInProgress = false;

            }
          }
          
        }
        

      } else {

        thisTorrent._active = false ;
        thisTorrent._followingName = null ;
        thisTorrent._handleError({mesage:"Torrent not active on server"});

      }
      
      thisTorrent._log("unlocking torrents with same following name")
      
      for (var username in thisAccount._torrents){

      if (thisAccount._torrents[username]._active) {              
          thisAccount._torrents[username]._updateInProgress = false;
      }
    }

      if (cbfunc) {

        thisTorrent._do(cbfunc);

      }

    }, function(ret) {

      thisTorrent._handleError(ret);

    });
    
  } else {
     
    thisTorrent._handleError({
      message: "Torrent inactive. Activate torrent first!",
      code: 32082
    });
    
  }

}

FreechTorrent.prototype._fillCacheUsingGetposts = function (count,requests,cbfunc) {

  var Freech = this._scope;

  var thisTorrent = this;
  var thisStream = Freech.getUser(this._name)._stream;

  if (thisTorrent._active) {

    thisStream._log("querying getposts for "+requests.length+" users")

    for (var i in requests){
      Freech.getUser(requests[i].username)._stream._updateInProgress = true;    
    }

    thisTorrent.RPC("getposts", [ count , requests ], function(res) {

      var minIds = {};

      if (res.length>0) {

        for (var i in res) {

          var resUsername = res[i].userpost.n;
          var resId = res[i].userpost.k;

          if (resUsername in minIds) {
            minIds[resUsername]=Math.min(resId,minIds[resUsername]);
          } else {
            minIds[resUsername]=resId;
          }

          var resStream = Freech.getUser(res[i].userpost.n)._stream;

          resStream._verifyAndCachePost(res[i]);

        }

        if (res.length<count) {

          thisStream._log("got all posts, no need to requery");

          for (var i in requests){
            if ( !requests.max_id || requests.max_id==-1 ) {
              Freech.getUser(requests[i].username)._stream._lastUpdate = Date.now()/1000;
              Freech.getUser(requests[i].username)._stream._updateInProgress = false;
            }
          }

          cbfunc(true);

        } else {

          var newrequests = [];

          for (var i in requests){

            if (!(requests[i].username in minIds)) {
              newrequests.push(requests[i]);
            } else {
              Freech.getUser(requests[i].username)._stream._lastUpdate = Date.now()/1000;
              Freech.getUser(requests[i].username)._stream._updateInProgress = false;
            }


            if ( !requests.max_id || requests.max_id==-1 ) {
              Freech.getUser(requests[i].username)._stream._lastUpdate = Date.now()/1000;
              Freech.getUser(requests[i].username)._stream._updateInProgress = false;
            }


          }

          if (newrequests.length) {

            thisStream._log("incomplete result. requerying");

            setTimeout(function(){
              thisTorrent._fillCacheUsingGetposts(count,newrequests,cbfunc);
            },200);

          } else {

            thisStream._log("count full but ok");

            cbfunc(true);

          }

        }

      } else {

        thisStream._log("getposts gave an empty result")

      }

    }, function(ret) {

        thisStream._handleError(ret);

    });

  } else {

    cbfunc(false);

  }
    
}

FreechTorrent.prototype._checkForUpdatesUsingGetLastHave = function (cbfunc) {

  var Freech = this._scope;

  var thisTorrent = this;
  var thisStream = Freech.getUser(this._name)._stream;
  var thisAccount = Freech.getAccount(this._walletusername);
    
  
  for (var username in thisAccount._torrents){

    if (thisAccount._torrents[username]._active) {              
        Freech.getUser(username)._stream._updateInProgress = true;
    }
  }
  
  thisTorrent._checkQueryAndDo( function() {

    if (thisTorrent._active) {

      var outdatedUsers =[];

      for (var username in thisAccount._torrents) {

        var resTorrent = thisAccount._torrents[username];

        if (resTorrent._active) {

          resTorrent._latestId = resTorrent._latestId;       
          resTorrent._lastUpdate = Date.now()/1000;  
          resTorrent._updateInProgress = false;

        }

        thisTorrent._log("comparing latest id for ",username,resTorrent._latestId,Freech.getUser(username)._stream._latestId);
        
        if (resTorrent._latestId==Freech.getUser(username)._stream._latestId) {

          Freech.getUser(username)._stream._lastUpdate=Date.now()/1000;
          Freech.getUser(username)._stream._updateInProgress=false;

        } else {

          
          thisTorrent._log("found outdated user ",username);
          
          outdatedUsers.push({username:username});

        }

      }

      thisTorrent._fillCacheUsingGetposts(30,outdatedUsers,function(){

          cbfunc(true);

          for (var username in thisAccount._torrents){

            if (thisAccount._torrents[username]._active) {              
                Freech.getUser(username)._stream._updateInProgress = false;
            }
          }

      });

    } else {

      cbfunc(false);

    }

    for (var username in thisAccount._torrents){

      if (thisAccount._torrents[username]._active) {              
          Freech.getUser(username)._stream._updateInProgress = false;
      }
    }

  });
    
}

FreechTorrent.prototype.updatePostsCache = function (cbfunc) {
    
  var Freech = this._scope;

  var thisTorrent = this;
  var thisStream = Freech.getUser(this._name)._stream;

  thisStream._log("update posts cache "+thisStream._name)  

  thisTorrent._checkForUpdatesUsingGetLastHave(function(uptodate){

    if (uptodate) {
    thisStream._log("lasthaves "+thisTorrent._name+" worked") 

      cbfunc(true);

    } else {
    thisStream._log("lasthaves "+thisTorrent._name+" failed") 

      thisTorrent._fillCacheUsingGetposts(30,[{username:thisTorrent._name}],cbfunc);

    }

  });
    
}

FreechTorrent.prototype.fillPostsCache = function (id,cbfunc) {

  var Freech = this._scope;

  var thisTorrent = this;
  var thisUser = Freech.getUser(this._name);
  var thisStream = Freech.getUser(this._name)._stream;

  thisStream._log("fill cache "+thisTorrent._name+" id "+id)  

  thisTorrent._fillCacheUsingGetposts(30,[{username:thisTorrent._name,max_id:id}],cbfunc);

}