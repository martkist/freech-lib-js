'use strict';

var FreechProfile = require('./FreechProfile.js');
var FreechAvatar = require('./FreechAvatar.js');
var FreechFollowings = require('./FreechFollowings.js');
var FreechPubKey = require('./FreechPubKey.js');
var FreechStream = require('./FreechStream.js');
var FreechMentions = require('./FreechMentions.js');

/**
 * Describes a user in {@ Freech}. Allows for accessing all public onformation about this user.
 * @class
 */
function FreechUser(name,scope) {
    
    this._name = name;
    this._scope = scope;
    
    this._type = "user";
    this._querySettings = {};
	this._hasParentUser = false;

    this._profile = new FreechProfile(name,scope);
    this._avatar = new FreechAvatar(name,scope);
    this._followings = new FreechFollowings(name,scope);
    this._pubkey = new FreechPubKey(name,scope);
    this._stream = new FreechStream(name,scope);
    this._mentions = new FreechMentions(name,scope);

}

module.exports = FreechUser;

FreechUser.prototype.trim = function () {
  
  delete Freech._userCache[this._name];
  
}

FreechUser.prototype.flatten = function () {

    return {
        
        name: this._name,
        querySettings: this._querySettings,
        
        profile: this._profile.flatten(),
        avatar: this._avatar.flatten(),
        followings: this._followings.flatten(),
        pubkey: this._pubkey.flatten(),
        stream: this._stream.flatten(),
        mentions: this._mentions.flatten()
        
    };


}

FreechUser.prototype.inflate = function (flatData) {
    
    this._querySettings = flatData.querySettings;
    
    this._profile.inflate(flatData.profile);
    this._avatar.inflate(flatData.avatar);
    this._followings.inflate(flatData.followings);
    this._pubkey.inflate(flatData.pubkey);
    this._stream.inflate(flatData.stream);
    this._mentions.inflate(flatData.mentions);

}

FreechUser.prototype.trim = function (timestamp) {

  var keepUser = false;
  
  this._profile.trim(timestamp);
  keepUser = keepUser || this._profile.inCache();
  
  this._avatar.trim(timestamp);
  keepUser = keepUser || this._avatar.inCache();
  
  this._followings.trim(timestamp);
  keepUser = keepUser || this._followings.inCache();
  
  this._mentions.trim(timestamp);
  keepUser = keepUser || this._mentions.inCache();
  
  this._stream.trim(timestamp);
  keepUser = keepUser || this._stream.inCache();
  
  this._pubkey.trim(timestamp);
  keepUser = keepUser || this._pubkey.inCache();

  if ( !keepUser ) {
    delete this._scope._userCache[this._name];
  }
  
}

FreechUser.prototype.getUsername = function () {
    return this._name;
}

FreechUser.prototype._doPubKey = function (cbfunc, querySettings) {
    this._pubkey._checkQueryAndDo(cbfunc, querySettings);
}

FreechUser.prototype.doProfile = function (cbfunc, querySettings) {
    this._profile._checkQueryAndDo(cbfunc, querySettings);
};

FreechUser.prototype.getProfile = function () {
    return this._profile;
};

FreechUser.prototype.doAvatar = function (cbfunc, querySettings) {
    this._avatar._checkQueryAndDo(cbfunc, querySettings);
};

FreechUser.prototype.getAvatar = function () {
    return this._avatar;
};

FreechUser.prototype.doFollowings = function (cbfunc, querySettings) {
    this._followings._checkQueryAndDo(cbfunc, querySettings);
};

FreechUser.prototype.getFollowings = function () {
    return this._followings;
};

FreechUser.prototype.doStatus = function (cbfunc, querySettings) {
    this._stream._checkQueryAndDo(cbfunc, querySettings);
};

FreechUser.prototype.doPost = function (id, cbfunc, querySettings) {
    this._stream._doPost(id, cbfunc, querySettings);
}


FreechUser.prototype.getPost = function (id) {
    if (id in this._stream._posts) {
		return this._stream._posts[id];
	} else {
		return null;	
	}
}

FreechUser.prototype.doMentions = function (cbfunc, querySettings) {

    this._mentions._checkQueryAndDo(cbfunc);

}

FreechUser.prototype.getMentions = function () {
    return this._mentions;
}

FreechUser.prototype.doLatestPostsUntil = function (cbfunc, querySettings) {

    this._stream._doUntil(cbfunc, querySettings);

}