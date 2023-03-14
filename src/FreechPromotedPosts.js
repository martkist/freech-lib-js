var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the promoted posts that are part of the freech blockchain.
 * @class
 */
var FreechPromotedPosts = function (scope) {
    
    var name = "promoted";
	this._hasParentUser = false;
	
    FreechResource.call(this,name,scope);
    
    this._latestId = -1;
    this._posts = {};
    
    this._type = "promotedposts";

}

inherits(FreechPromotedPosts,FreechResource);

FreechPromotedPosts.prototype.flatten = function () {

    var flatData = FreechResource.prototype.flatten.call(this);
    
    var flatPosts = [];
    
    for (var id in this._posts){
        flatPosts.push(this._posts[id].flatten());
    }
    
    flatData.posts = flatPosts;
    flatData.latestId  = this._latestId;    
    
    return flatData;

}

FreechPromotedPosts.prototype.inflate = function (flatData) {
    
    var FreechPost = require('./FreechPost.js');
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._latestId = flatData.latestId;
    
    for(var i = 0; i < flatData.posts.length; i++){
        
        var newpost = new FreechPost(flatData.posts[i].data,flatData.posts[i].signature,this._scope);
        newpost.inflate(flatData.posts[i]);
        this._posts[newpost.getId()]=newpost;
    
    }

}

FreechPromotedPosts.prototype.trim =  function (timestamp) {
  
  for (var id in this._posts) {
      
    if (id!=this._latestId) {
      
      this._posts[id].trim(timestamp);
      
    }

  }
  
  var postCount = Object.keys(this._posts).length;
  
  if ( postCount<=1 && (!timestamp || timestamp > this._lastUpdate) ){
    
    if (this._posts[this._latestId]) {

      this._posts[this._latestId].trim();

    }
    
    var postCount = Object.keys(this._posts).length;

    if (postCount==0) {

      var FreechPromotedPosts = require("./FreechPromotedPosts.js");

      this._scope._promotedPosts = new FreechPromotedPosts(this._name,this._scope);
      
    }

  } 
  
}

FreechPromotedPosts.prototype._do =  function (cbfunc) {
    
    this._doPost(this._latestId,cbfunc);
    
}

FreechPromotedPosts.prototype._queryAndDo = function (cbfunc) {
    	
    var thisResource = this;
        
	thisResource.RPC("getspamposts", [ 30 ], function(res) {
            		
			if (res.length>0) {

				for (var i = 0; i<res.length; i++) {

					thisResource._verifyAndCachePost(res[i],function(newpost){

						if ( newpost.getId() > thisResource._latestId ) {

							thisResource._latestId = newpost.getId();
							thisResource._lastUpdate = Date.now()/1000;

						}

					});

				}
				
				thisResource._do(cbfunc);

			} 

		}, function(ret) {

			thisResource._handleError(ret);

		}
					 
	);
 
        
}

FreechPromotedPosts.prototype._verifyAndCachePost =  function (payload,cbfunc) {
	
    var Freech = this._scope;
        
    var thisResource = this;
    
    var newid = payload.userpost.k;
    var payloadUser = payload.userpost.n;
    
    if( !( newid in thisResource._posts) ) {

		var signatureVerification = thisResource.getQuerySetting("signatureVerification");

        var FreechPost = require('./FreechPost.js');

        var newpost = new FreechPost(payload.userpost,payload.sig_userpost,thisResource._scope);

		newpost._isPromotedPost = true;
		
        thisResource._posts[newpost.getId()] = newpost;
        
        if ( thisResource._latestId<newpost.getId() ) {
        
            thisResource._latestId=newpost.getId();
        
        }
        
        if (cbfunc) {
          
            newpost._verified = true;
            
            cbfunc(newpost);

        } 
      
    }

}

FreechPromotedPosts.prototype._doPost = function (id,cbfunc) {

    var Freech = this._scope;
    
    if (id && id>0) {

        if (id in this._posts){
            
            cbfunc(this._posts[id])
            
        } else {
            
            var thisResource = this;
            
            thisResource.RPC("getspamposts", [ 30 , id ], function(res) {
            		
					if (res.length>0) {

						for (var i = 0; i<res.length; i++) {

							thisResource._verifyAndCachePost(res[i]);

						}

						cbfunc(thisResource._posts[id])

					} 

				}, function(ret) {

					thisResource._handleError(ret);

				}

			);
            
        }
        
    }
    
};


FreechPromotedPosts.prototype.doLatestPostsUntil = function (cbfunc, querySettings) {

  Freech._promotedPosts._checkQueryAndDo(function doUntil(post){

    var retVal = cbfunc(post);

    if( post.getId()!=1 && retVal!==false ) { 

      post.doPreviousPost(doUntil, querySettings); 

    }

  }, querySettings);
	
}

module.exports = FreechPromotedPosts;

