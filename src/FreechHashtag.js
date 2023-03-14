var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');


/**
 * Describes a hashtag resource.
 * @module
 */
var FreechHashtag = function (name,scope) {
    
    FreechResource.call(this,name,scope);
    this._type = "hashtag";
    this._data = {};
	this._hasParentUser = false;
    
}

inherits(FreechHashtag,FreechResource);

FreechHashtag.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    delete this._scope._hashtags[this._name];
    
  }

}

FreechHashtag.prototype._do = function (cbfunc) {
	this.doPosts(cbfunc);
}

FreechHashtag.prototype._queryAndDo = function (cbfunc, querySettings) {
    
    var currentCounter = 1;
        
    var Freech = this._scope;
    
    var thisHashtag = this;
    
    thisHashtag._data = {};

    thisHashtag._lastUpdate=Date.now()/1000;
        
    thisHashtag.dhtget([thisHashtag._name, "hashtag", "m"],

        function (result) {
      
            var FreechPost = require("./FreechPost.js");

            for (i=0; i<result.length; i++) {

                var username = result[i].p.v.userpost.n;
                var id = result[i].p.v.userpost.k;

                thisHashtag._data[username+":post"+id]=true;                

                if (! (id in Freech.getUser(username)._stream._posts ) ) {
                
                    Freech.getUser(username)._stream._verifyAndCachePost(result[i].p.v);
                    
                }

            }
        
            thisHashtag._do(cbfunc);

        }
                        
    ); 
        
}


/** @function
 * @name doPosts 
 * @description calls cbfunc with every {@link FreechPost} object of the hashtag.
 * @param {function} cbfunc callback function
 */
FreechHashtag.prototype.doPosts = function (cbfunc) {

	var posts = [];
	
    for (var key in this._data) {

        var nandk = key.split(":post");
        var username = nandk[0];
        var id = parseInt(nandk[1]);
        
		posts.push(Freech.getUser(username).getPost(id));
		
    }
	
	cbfunc(posts);

}

module.exports = FreechHashtag;