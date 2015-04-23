'use strict';

var inherits = require('inherits');
var TwisterResource = require('./TwisterResource.js');

/**
 * Describes the torrent of the {@link TwisterPosts} of a {@link TwisterUser} when available on the host. The torrent significantly speeds up post querying time. It is implemented as a look-ahead that is queryied when accessing a post that is not already in cache.
 * @class
 */
function TwisterTorrent(name,scope) {
    
    TwisterResource.call(this,name,scope);
    
    this._active = false;
    this._type = "torrent";
    this._followingName = null;

    
}

inherits(TwisterTorrent,TwisterResource);

module.exports = TwisterTorrent;

TwisterTorrent.prototype.flatten = function () {

    var flatData = TwisterResource.prototype.flatten.call(this);
    
    flatData.active = this._active;
    flatData.followingName = this._followingName;

    return flatData;
    
}

TwisterTorrent.prototype.inflate = function (flatData) {

    TwisterResource.prototype.inflate.call(this,flatData);
    
    this._active = flatData.active;
    this._followingName = flatData.followingName;

}

TwisterTorrent.prototype._do = function (cbfunc) {
        cbfunc(this._active);
}

TwisterTorrent.prototype.activate =  function (followingName,cbfunc) {

    var Twister = this._scope;

    var thisTorrent = this;
    
    if (this._followingName && this._followingName!=followingName) {
    
        this.deactivate(function(){
        
            thisTorrent.activate(followingName,cbfunc);
        
        });
    
    } else {
        
        this._followingName=followingName;
    

        if (!thisTorrent._active) {

            thisTorrent.RPC("follow", [ followingName, [thisTorrent._name] ], function(res) {

                thisTorrent._active = true ;

                if (cbfunc) {
                    cbfunc(res);        
                }

            }, function(ret) {
                
                thisTorrent._handleError(ret);

            });

        } else {

            if (cbfunc) {
                cbfunc();        
            }

        }
        
    }

}

TwisterTorrent.prototype.deactivate =  function (cbfunc) {

    var Twister = this._scope;
    
    var thisTorrent = this;
    
    thisTorrent.RPC("unfollow", [ thisTorrent._followingName ,[this._name] ], function(res) {
        
        thisTorrent._active = false ;
        
        if (cbfunc) {
            cbfunc(res);        
        }
        
    }, function(ret) {
        
        console.log(ret);
        
    });

}

TwisterTorrent.prototype.getQuerySetting = function (setting) {

	//console.log(this._name);
	
    var Twister = this._scope;
    
    if (setting in this._activeQuerySettings) {
        return this._activeQuerySettings[setting];
    }
    
    if (setting in this._querySettings) {
        return this._querySettings[setting];
    }
	
    if (setting in Twister.getAccount(this._followingName)._querySettings) {
        return Twister.getAccount(this._followingName)._querySettings[setting];
    }
	
    if (setting in Twister.getUser(this._name)._stream._activeQuerySettings) {
        return Twister.getUser(this._name)._stream._activeQuerySettings[setting];
    }
	
    if (setting in Twister.getUser(this._name)._stream._querySettings) {
        return Twister.getUser(this._name)._stream._querySettings[setting];
    }
	
	return TwisterResource.prototype.getQuerySetting.call(this,setting);

}

TwisterTorrent.prototype._queryAndDo = function (cbfunc) {

    var Twister = this._scope;
    
    var thisTorrent = this;

    thisTorrent.RPC("getfollowing", [ this._followingName ], function(res) {
        
        if (thisTorrent._name in res) { 
            
            thisTorrent._active = true ;
            
        } else {
            
            thisTorrent._active = false ;
            
        }
        
        if (cbfunc) {
            
            thisTorrent._do(cbfunc);
            
        }
        
        thisTorrent._lastUpdate = Date.now()/1000;
        
    }, function(ret) {
        
        thisTorrent._handleError(ret);
        
    });

}

TwisterTorrent.prototype._fillCacheUsingGetposts = function (count,usernames,maxId,sinceId,cbfunc) {

    var Twister = this._scope;
    
    var thisTorrent = this;
    var thisStream = Twister.getUser(this._name)._stream;
    
    if (thisTorrent._active) {
      
        //console.log("querying getposts for "+usernames)
    
        var requests = [];
        
        for (var i = 0; i<usernames.length; i++){
        
            var request = {username: usernames[i]};
            if (maxId>-1) { request["max_id"]=maxId; }
            if (sinceId>-1) { request["since_id"]=sinceId; }
            requests.push(request);
          
            Twister.getUser(usernames[i])._stream._updateInProgress = true;
            
        }
        
      
        thisTorrent.RPC("getposts", [ count , requests ], function(res) {
            
            if (res.length>0) {

                for (var i = 0; i<res.length; i++) {

                    thisStream = Twister.getUser(res[i].userpost.n)._stream;
                    
                    thisStream._verifyAndCachePost(res[i],function(newpost){
                    
                        if ( newpost.getId() > thisStream._latestId ) {

                            thisStream._latestId = newpost.getId();
                            thisStream._lastUpdate = Date.now()/1000;

                        }

                    });
                        
                }
              
                //console.log("maxId = "+maxId+" "+usernames)
                
                if ( !maxId || maxId==-1 ) {
                
                    for (var i = 0; i<usernames.length; i++){

                        Twister.getUser(usernames[i])._stream._lastUpdate = Date.now()/1000;

                    }
                    
                }

                cbfunc(true);

            } else {

                thisTorrent._checkQueryAndDo(function(active){
                    
                    if (active) {
                    
                        thisStream._lastUpdate = Date.now()/1000;
                    
                    }
                    
                });

            }
          
            for (var i = 0; i<usernames.length; i++){ 
                Twister.getUser(usernames[i])._stream._updateInProgress = false;
            }

        }, function(ret) {
        
            thisStream._handleError(ret);

        });
    
    } else {

        cbfunc(false);

    }
    
}

TwisterTorrent.prototype._checkForUpdatesUsingGetLastHave = function (cbfunc) {

    var Twister = this._scope;
    
    var thisTorrent = this;
    var thisStream = Twister.getUser(this._name)._stream;
    
  
    if (thisTorrent._active) {
        
            
        for (var username in Twister._userCache){
          
            if (Twister._userCache[username]._stream._torrent._followingName == thisTorrent._followingName) {              
                Twister._userCache[username]._stream._updateInProgress = true;
            }
        }
        
        
        thisTorrent.RPC("getlasthave", [ thisTorrent._followingName ], function(res) {

            if (res) {
                
                var thisUserIsUpToDate = false;
                
                var outdatedUsers =[];

                for (var username in res) {

                    
                    if (username==thisTorrent._name && res[username]==thisStream._latestId) {
                                                
                        thisUserIsUpToDate = true;
                    
                    }
                    
                    if (res[username]==Twister.getUser(username)._stream._lastId) {
                      
                        Twister.getUser(username)._stream._lastUpdate=Date.now()/1000;
                        
                    } else {
                        
                        outdatedUsers.push(username);
                        
                    }
                    
                        
                }
                
                thisTorrent._fillCacheUsingGetposts(30,outdatedUsers,-1,-1,function(){
                
                    cbfunc(true);
                    
                    for (var username in Twister._cache){
                        if (Twister._cache[username]._stream._torrent._followingName == thisTorrent._followingName) {
                            Twister._cache[username]._stream._updateInProgress = false;
                        }
                    }
                
                });

            } else {
            
                cbfunc(false);
                
            }
            
            for (var username in Twister._cache){
                if (Twister._cache[username]._stream._torrent._followingName == thisTorrent._followingName) {
                    Twister._cache[username]._stream._updateInProgress = false;
                }
            }

        }, function(ret) {
        
            thisStream._handleError(ret);
            
            cbfunc(false);

        });
    
    } else {

        cbfunc(false);

    }
    
}

TwisterTorrent.prototype.updateCache = function (cbfunc) {
    
    var Twister = this._scope;
    
    var thisTorrent = this;
    var thisStream = Twister.getUser(this._name)._stream;
      
    //console.log("update cache "+thisTorrent._name)  
    thisTorrent._checkForUpdatesUsingGetLastHave(function(uptodate){
    
      
        if (uptodate) {
        //console.log("lasthaves "+thisTorrent._name+" worked") 
            
            cbfunc(true);
            
        } else {
        //console.log("lasthaves "+thisTorrent._name+" failed") 
            
            thisTorrent._fillCacheUsingGetposts(30,[thisTorrent._name],-1,-1,cbfunc);
            
        }
        
    });
        

}

TwisterTorrent.prototype.fillCache = function (id,cbfunc) {

    var Twister = this._scope;
    
    var thisTorrent = this;
    var thisUser = Twister.getUser(this._name);
  
    //console.log("fill cache "+thisTorrent._name)  
    
    thisTorrent._fillCacheUsingGetposts(30,[thisTorrent._name],id,-1,cbfunc);

}