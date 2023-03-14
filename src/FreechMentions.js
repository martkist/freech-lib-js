var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the mentions of a {@link FreechUser}.
 * @module
 */
var FreechMentions = function (name,scope) {
    
    FreechResource.call(this,name,scope);
    this._type = "mentions";
    this._data = {};
    
}

inherits(FreechMentions,FreechResource);

FreechMentions.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisUser = this._scope.getUser(this._name);

    var FreechMentions = require("./FreechMentions.js");
    
    thisUser._mentions = new FreechMentions(this._name,this._scope);
    
  }

}

FreechMentions.prototype._do = function (cbfunc) {
	this.doPosts(cbfunc);
}

FreechMentions.prototype._queryAndDo = function (cbfunc) {
    
    var currentCounter = 1;
        
    var Freech = this._scope;
    
    var thisMentions = this;
    
    var thisUser = Freech.getUser(this._name);

    thisMentions._data = {};

    thisMentions._lastUpdate=Date.now()/1000;
        
    thisMentions.dhtget([thisUser.getUsername(), "mention", "m"],

        function (result) {

            var FreechPost = require("./FreechPost.js");

            for (i=0; i<result.length; i++) {

                var username = result[i].p.v.userpost.n;
                var id = result[i].p.v.userpost.k;

                thisMentions._data[username+":post"+id]=true;                

                if (! (id in Freech.getUser(username)._stream._posts ) ) {
                
                    Freech.getUser(username)._stream._verifyAndCachePost(result[i].p.v);
                    
                }

            }
        
            thisMentions._do(cbfunc);

        }
                        
    ); 
        
}

/** @function
 * @name doPosts 
 * @description calls cbfunc with every {@link FreechPost} object of the mentions.
 * @param {function} cbfunc callback function
 */
FreechMentions.prototype.doPosts = function (cbfunc) {

	var posts = [];
	
    for (var key in this._data) {

        var nandk = key.split(":post");
        var username = nandk[0];
        var id = parseInt(nandk[1]);
        
		posts.push(Freech.getUser(username).getPost(id));
		
    }
	
	cbfunc(posts);

}

module.exports = FreechMentions;