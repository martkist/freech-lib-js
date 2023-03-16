"use strict";

var inherits = require('inherits');
var FreechResource = require('./FreechResource.js');
var FreechReplies = require('./FreechReplies.js');
var FreechRefreechs = require('./FreechRefreechs.js');

/**
 * Describes a single post of a {@link FreechUser}.
 * @module
 */
function FreechPost(data,signature,scope) {
    
    var name = data.n;
    var id = data.k;
    
    FreechResource.call(this,name,scope);
    
    this._type = "post";
    this._data = data;
    this._signature = signature;
	this._isPromotedPost = false;
    this._replies = new FreechReplies(name,id,scope);
    this._refreechs = new FreechRefreechs(name,id,scope);
    
}

inherits(FreechPost,FreechResource);

module.exports = FreechPost;

FreechPost.prototype.flatten = function () {

    var flatData = FreechResource.prototype.flatten.call(this);
    
    flatData.refreechs = this._refreechs.flatten();
    flatData.replies = this._replies.flatten();
  
    flatData.isPromotedPost = this._isPromotedPost;
    flatData.signature = this._signature;
        
    return flatData;

}

FreechPost.prototype.inflate = function (flatData) {
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._replies.inflate(flatData.replies);
    this._refreechs.inflate(flatData.refreechs);

    this._signature = flatData.signature;
    this._isPromotedPost = flatData.isPromotedPost;
  
}

FreechPost.prototype.trim = function (timestamp) {

  var keepPost = false;
  
  this._replies.trim(timestamp);
  keepPost = keepPost || this._replies.inCache();

  this._refreechs.trim(timestamp);
  keepPost = keepPost || this._refreechs.inCache();

  if ( !keepPost && ( !timestamp || timestamp > this.getTimestamp() ) ){

    if (this._isPromotedPost) {
      var thisStream = this._scope._promotedPosts;
    } else {
      var thisStream = this._scope.getUser(this._name)._stream;
    }

    delete thisStream._posts[this.getId()];

    thisStream._latestId = Math.max.apply(Math,Object.keys(thisStream._posts));

  }

}

FreechPost.prototype._do = function (cbfunc) {
    cbfunc(this);
}

FreechPost.prototype._checkQueryAndDo = function (cbfunc) {
    cbfunc(this);
}

FreechPost.prototype._queryAndDo = function (cbfunc) {
    cbfunc(this);
}

/** @function
 * @name getId 
 * @description returns the post id.
 */
FreechPost.prototype.getId = function () {
    return this._data.k;
}

/** @function
 * @name getId 
 * @description returns the post id of the last post.
 */
FreechPost.prototype.getLastId = function () {
	if (!this._isPromotedPost) {
		return this._data.lastk;
	} else {
		return this._data.k-1;
	}
}


/** @function
 * @name doPreviousPost 
 * @description calls cbfunc with the previous post as argument. Queries the post if not in cache.
 * @param cbfunc {function} 
 * @param querySettings {Object} 
 */
FreechPost.prototype.doPreviousPost = function (cbfunc,querySettings) {
	
	if (!this._isPromotedPost) {
		this._scope.getUser(this.getUsername()).doPost(this.getLastId(),cbfunc,querySettings);
	} else {
      //console.log(this)
		this._scope.getPromotedPosts()._doPost(this.getLastId(),cbfunc,querySettings);
	}
	
}

/** @function
 * @name getTimestamp 
 * @description returns the timestamp of the post.
 */
FreechPost.prototype.getTimestamp = function () {
    return this._data.time;
}


/** @function
 * @name getContent 
 * @description returns the content of the post.
 */
FreechPost.prototype.getContent = function () {
    return this._data.msg;
}


/** @function
 * @name getUsername 
 * @description returns the user that posted the post.
 */
FreechPost.prototype.getUsername = function () {
    return this._data.n;
}

/** @function
 * @name getUsername 
 * @description returns the {@link FreechUser} object of the user that posted the post.
 */
FreechPost.prototype.getUser = function () {
    return this._scope.getUser(this._data.n);
}


/** @function
 * @name isReply 
 * @description returns true if the postis an reply.
 */
FreechPost.prototype.isReply = function () {
    return ("reply" in this._data);
}


/** @function
 * @name getReplyUsername 
 * @description returns the username of the user to which this post is a reply.
 */
FreechPost.prototype.getReplyUsername = function () {
    return this._data.reply.n;
}


/** @function
 * @name getReplyId 
 * @description returns the id of the post that this post is replying to.
 */
FreechPost.prototype.getReplyId = function () {
    return this._data.reply.k;
}


/** @function
 * @name doReplies 
 * @description calls cbfunc for every post that is a reply to this post.
 * @param cbfunc {function} 
 * @param querySettings {Object} 
 */
FreechPost.prototype.doReplies = function (cbfunc,querySettings) {
    this._replies._checkQueryAndDo(cbfunc,querySettings);  
}

/** @function
 * @name doPostRepliedTo 
 * @description calls cbfunc with the post that this post is replying to.
 * @param cbfunc {function} 
 * @param querySettings {Object} 
 */
FreechPost.prototype.doPostRepliedTo = function (cbfunc,querySettings) {
    this._scope.getUser(this.getReplyUsername()).doPost(this.getReplyId(),cbfunc,querySettings);
}

/** @function
 * @name isRefreech 
 * @description returns true if the postis an rewtist.
 */
FreechPost.prototype.isRefreech = function () {
    return ("rt" in this._data);
}

/** @function
 * @name isRefreech 
 * @description returns true if the postis an rewtist.
 */
FreechPost.prototype.isRefreechWithComment = function () {
    return ("rt" in this._data && "msg" in this._data);
}


/** @function
 * @name getRefreechedId 
 * @description returns the id of the refreeched post.
 */
FreechPost.prototype.getRefreechedId = function () {
    return this._data.rt.k;
}

/** @function
 * @name getRefreechedlastId 
 * @description returns the last id of the rewisted post.
 */
FreechPost.prototype.getRefreechedlastId = function () {
    return this._data.rt.lastk;
}

/** @function
 * @name getRefreechedTimestamp 
 * @description returns the timestamp of the refreeched post
 */
FreechPost.prototype.getRefreechedTimestamp = function () {
    return this._data.rt.time;
}

/** @function
 * @name getRefreechedContent 
 * @description returns content of the rwteisted post
 */
FreechPost.prototype.getRefreechedContent = function () {
    return this._data.rt.msg;
}

/** @function
 * @name getRefreechedUser 
 * @description returns the username of the refreeched post.
 */
FreechPost.prototype.getRefreechedUsername = function () {
    return this._data.rt.n;
}

/** @function
 * @name doRefreechingPosts 
 * @description calls cbfunc with an array of the post that are refreeching this post.
 * @param cbfunc {function} 
 * @param querySettings {Object} 
 */
FreechPost.prototype.doRefreechingPosts = function (cbfunc,querySettings) {
    this._refreechs._checkQueryAndDo(cbfunc,querySettings);
}


/** @function
 * @name getRefreechedPost 
 * @description return an uncached and unverified {@link FreechPost} object of the refreeched post.
 * @param cbfunc {function} 
 */
FreechPost.prototype.getRefreechedPost = function (cbfunc) {
    
    return new FreechPost(this._data.rt,this._data.sig_rt,this._scope);
    
}

/** @function
 * @name doRefreechedPost 
 * @description Verifies and caches the refreeched post and calls cbfunc with it.
 * @param cbfunc {function} 
 */
FreechPost.prototype.doRefreechedPost = function (cbfunc) {
    
    var Freech = this._scope;
    
    var id = this._data.rt.k;
    
    if (!Freech.getUser(this._data.rt.n)._posts[id]) {
        
        var payload= {
            userpost: this._data.rt,
            sig_userpost: this._data.sig_rt
        };
        
        Freech.getUser(this._data.rt.n)._verifyAndCachePost(payload,cbfunc);
        
    } else {

        cbfunc(Freech.getUser(this._data.rt.n)._posts[id]);
        
    }
    
}
