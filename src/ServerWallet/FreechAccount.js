var inherits = require('inherits');

var FreechResource = require('../FreechResource.js');

/**
 * Describes a user account in Freech. Allows for the private information about that user as well as for posting new messages.
 * @class ServerWallet_FreechAccount
 */
function FreechAccount(name,scope) {
    
	FreechResource.call(this,name,scope);
	
    this._name = name;
    this._scope = scope;
	
    this._type = "account";
	this._hasParentUser = false;
    
	this._wallettype = "server";
	
	this._directmessages = {};
  
    this._torrents = {};

}

module.exports = FreechAccount;

inherits(FreechAccount,FreechResource);

FreechAccount.prototype.createUser = function (name, cbfunc) {

     this.RPC("createwalletuser",[name], cbfunc,

     function(err){
         return err
     });
}

FreechAccount.prototype.propagateUser = function (name, cbfunc) {

      this.RPC("sendnewusertransaction",[name], cbfunc,

     function(err){
         return err
     })
}

FreechAccount.prototype.flatten = function () {
    
    var flatData = FreechResource.prototype.flatten.call(this);

    flatData.wallettype = this._wallettype;
    
    flatData.directmessages = [];
    
    for (var username in this._directmessages){
        flatData.directmessages.push(this._directmessages[username].flatten());
    }
  
    flatData.torrents = [];
    
    for (var username in this._torrents){
        flatData.torrents.push(this._torrents[username].flatten());
    }
    
    return flatData;


}

FreechAccount.prototype.inflate = function (flatData) {
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._wallettype = flatData.wallettype;
    this._privateFollowings = flatData.privateFollowings;

    var FreechDirectMessages = require('./FreechDirectMessages.js');
    var FreechTorrent = require('./FreechTorrent.js');

    for(var i in flatData.directmessages){

        var newuser = new FreechDirectMessages(this._name,flatData.directmessages[i].name,Freech);
        newuser.inflate(flatData.directmessages[i]);
        this._directmessages[flatData.directmessages[i].name]=newuser;

    }

    for(var i in flatData.torrents){

        var newuser = new FreechTorrent(this._name,flatData.torrents[i].name,Freech);
        newuser.inflate(flatData.torrents[i]);
        this._torrents[flatData.torrents[i].name]=newuser;

    }

}

FreechAccount.prototype.trim = function (timestamp) {

  for (var username in this._directmessages){
    this._directmessages[username].trim(timestamp);
  }

  for (var username in this._torrents){
    this._torrents[username].trim(timestamp);
  }
  
}


FreechAccount.prototype.getUsername = function () {return this._name}

FreechAccount.prototype.activateTorrents = function (cbfunc,querySettings) {

	var Freech = this._scope;
    
    var thisAccount = this;

    thisAccount.RPC("getlasthave", [ this._name ], function(res) {
        
		for (var username in res) {
          
          var resTorrent = thisAccount.getTorrent(username);

          resTorrent.activate();

          resTorrent._latestId = res[username];       
          resTorrent._lastUpdate = Date.now()/1000;  
          resTorrent._updateInProgress = false;
          
          thisAccount._log("torrent for "+username+" activated");

		}
		
		cbfunc();
        
    }, function(ret) {
        
        thisAccount._handleError(ret);
        
    });

}

FreechAccount.prototype.unfollow = function (username,cbfunc) {
  
  var thisAccount = this;
    
  var Freech = this._scope;

  thisAccount.RPC("unfollow",[
    
      thisAccount._name,
      [username]
    
  ],function(result){

    Freech.getUser(thisAccount._name).doFollowings(cbfunc,{outdatedLimit: 0});
    
  },function(error){
      FreechAccount._handleError(error);
  });

}

FreechAccount.prototype.follow = function (username,cbfunc) {
  
  var thisAccount = this;
    
  var Freech = this._scope;

  thisAccount.RPC("follow",[
    
      thisAccount._name,
      [username]
    
  ],function(result){
    
    Freech.getUser(thisAccount._name).doFollowings(cbfunc,{outdatedLimit: 0});
    
  },function(error){
    thisAccount._handleError(error);
  });

}

FreechAccount.prototype.updateProfile = function (newdata,cbfunc) {

	var thisAccount = this;
    
    var Freech = this._scope;
    var thisUser = Freech.getUser(this._name);
    
    thisUser.doProfile(function(profile){
	
      thisAccount.RPC("dhtput",[
          thisAccount._name,
          "profile",
          "s",
          newdata,
          thisAccount._name,
          profile._revisionNumber+1
      ],function(result){

        var FreechProfile = require("../FreechProfile.js");

        var newprofile = new FreechProfile(thisAccount._name,Freech);
        newprofile._data = newdata;
        cbfunc(newprofile);

      },function(error){
        thisAccount._handleError(error);
      });
	
	},{errorfunc:function(error){
    
      if (error.code==32052) {
       
        Freech.getUser(this._name)._profile._lastUpdate = Date.now()/1000;
        Freech.getUser(this._name)._profile._revisionNumber = 0;
        Freech.getUser(this._name)._profile._updateInProgress = false;
        
        thisAccount.updateProfileFields(newdata,cbfunc);
        
      }
      
    }})

}

FreechAccount.prototype.updateProfileFields = function (newdata,cbfunc) {

	var thisAccount = this;
    
    var Freech = this._scope;
    var thisUser = Freech.getUser(this._name);
  
    thisUser.doProfile(function(profile){
      
      var olddata = JSON.parse(JSON.stringify(profile._data));
      
      for (var key in newdata) {

          olddata[key] = newdata[key];

      }
      
      thisAccount.RPC("dhtput",[
          thisAccount._name,
          "profile",
          "s",
          olddata,
          thisAccount._name,
          profile._revisionNumber+1
        ],function(result){
          
          var FreechProfile = require("../FreechProfile.js");
          
          var newprofile = new FreechProfile(thisAccount._name,Freech);
          newprofile._data = olddata;
          cbfunc(newprofile);
        
        },function(error){
          thisAccount._handleError(error);
      });
	
    },{errorfunc:function(error){
    
      if (error.code==32052) {
       
        Freech.getUser(this._name)._profile._lastUpdate = Date.now()/1000;
        Freech.getUser(this._name)._profile._revisionNumber = 0;
        Freech.getUser(this._name)._profile._updateInProgress = false;
        
        thisAccount.updateProfileFields(newdata,cbfunc);
        
      }
      
    }})

}

FreechAccount.prototype.updateAvatar = function (newdata,cbfunc) {

	var thisAccount = this;
    
    var Freech = this._scope;
    
    Freech.getUser(this._name).doAvatar(function(avatar){
	
		thisAccount.RPC("dhtput",[
			thisAccount._name,
			"avatar",
			"s",
			newdata,
			thisAccount._name,
			avatar._revisionNumber+1
		],function(result){
          
          var FreechAvatar = require("../FreechAvatar.js");
          
          var newprofile = new FreechAvatar(thisAccount._name,Freech);
          newprofile._data = newdata;
          cbfunc(newprofile);
		
		},function(error){
          thisAccount._handleError(error);
		});
	
	},{errorfunc:function(error){
    
      if (error.code==32052) {
       
        Freech.getUser(this._name)._avatar._lastUpdate = Date.now()/1000;
        Freech.getUser(this._name)._avatar._revisionNumber = 0;
        Freech.getUser(this._name)._avatar._updateInProgress = false;
        
        thisAccount.updateAvatar(newdata,cbfunc);
        
      }
      
    }})

}

FreechAccount.prototype.post = function (msg,cbfunc) {
  
  var thisAccount = this;
    
  var Freech = this._scope;

  this.getTorrent(this._name)._checkQueryAndDo(function(thisTorrent){

    var newid = thisTorrent._latestId+1;
    //thisTorrent._latestId = newid;

    thisAccount.RPC("newpostmsg",[
        thisAccount._name,
        newid,
        msg
    ],function(result){
      
//      var FreechPost = require("../FreechPost.js");      
//      var data = {};
//      data.n = thisAccount._name;
//      data.k = newid;
//      data.time = Math.round(Date.now()/1000);
//      data.msg = msg;
//      var newpost = new FreechPost(data,"",Freech);
//      cbfunc(newpost);
      Freech.getUser(thisAccount._name).doStatus(cbfunc,{outdatedLimit: 0});
    },function(error){
      thisAccount._handleError(error);
    });

  });

}

FreechAccount.prototype.reply = function (replyusername,replyid,msg,cbfunc) {
  
  var thisAccount = this;
    
  var Freech = this._scope;

  this.getTorrent(this._name)._checkQueryAndDo(function(thisTorrent){

    var newid = thisTorrent._latestId+1;
    //thisTorrent._latestId = newid;

    thisAccount.RPC("newpostmsg",[
        thisAccount._name,
        newid,
        msg,
        replyusername,
        replyid
    ],function(result){
      
//      var FreechPost = require("../FreechPost.js");      
//      var data = {};
//      data.n = thisAccount._name;
//      data.k = newid;
//      data.time = Math.round(Date.now()/1000);
//      data.msg = msg;
//      data.reply = { k: replyid, n: replyusername };
//      var newpost = new FreechPost(data,"",Freech);
//      cbfunc(newpost);
      Freech.getUser(thisAccount._name).doStatus(cbfunc,{outdatedLimit: 0});
    },function(error){
      thisAccount._handleError(error);
    });

  });

}

FreechAccount.prototype.refreech = function (rtusername,rtid,cbfunc) {
  
  var thisAccount = this;
    
  var Freech = this._scope;

  this.getTorrent(this._name)._checkQueryAndDo(function(thisTorrent){

    var newid = thisTorrent._latestId+1;
    //thisTorrent._latestId = newid;
    
    Freech.getUser(rtusername).doPost(rtid,function(post){

      thisAccount.RPC("newrtmsg",[
          thisAccount._name,
          newid,
          {  sig_userpost: post._signature, userpost: post._data }
      ],function(result){

//        var FreechPost = require("../FreechPost.js");      
//        var data = {};
//        data.n = thisAccount._name;
//        data.k = newid;
//        data.time = Math.round(Date.now()/1000);
//        data.rt = post._data;
//        var newpost = new FreechPost(data,"",Freech);
//        cbfunc(newpost);
        Freech.getUser(thisAccount._name).doStatus(cbfunc,{outdatedLimit: 0});
        
      },function(error){
        thisAccount._handleError(error);
      });
      
    });

  });

}

FreechAccount.prototype.getTorrent = function (username) {
  
  if( username in this._torrents ) {
    return this._torrents[username];
  } else {
    var FreechTorrent = require('./FreechTorrent.js');
    var newtorrent = new FreechTorrent(this._name,username,this._scope);
    this._torrents[username]=newtorrent;
    return this._torrents[username];
  }

}

FreechAccount.prototype.getDirectMessages = function (username, cbfunc, querySettings) {

	if ( !(username in this._directmessages) ){
	
		var FreechDirectMessages = require("./FreechDirectMessages.js");
		
		var newdmsgs = new FreechDirectMessages(this._name,username,this._scope);
		
		this._directmessages[username] = newdmsgs;
	
	}
	
	return this._directmessages[username];

}

FreechAccount.prototype.doLatestDirectMessage = function (username, cbfunc, querySettings) {

	this.getDirectMessages(username)._checkQueryAndDo(cbfunc, querySettings);

}

FreechAccount.prototype.doLatestDirectMessagesUntil = function (username, cbfunc, querySettings) {

	this.getDirectMessages(username)._doUntil(cbfunc, querySettings);

}
