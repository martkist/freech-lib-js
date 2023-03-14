var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the replies to a {ælink FreechPost}.
 * @class
 */
var FreechReplies = function (name,id,scope) {
    
    FreechResource.call(this,name,scope);
    this._type = "replies";
    this._id = id;
    this._data = {};
    
}

inherits(FreechReplies,FreechResource);

FreechReplies.prototype.flatten = function () {

    var flatData = FreechResource.prototype.flatten.call(this);
    
    flatData.id  = this._id;
    
    return flatData;


}

FreechReplies.prototype.inflate = function (flatData) {
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._id = flatData.id;

}

FreechReplies.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisPost = this._scope.getUser(this._name).getPost(this._id);

    var FreechReplies = require("./FreechReplies.js");
    
    thisPost._replies = new FreechReplies(this._name,this._id,this._scope);
    
  }

}

FreechReplies.prototype._do = function (cbfunc) {
	this.doPosts(cbfunc);
}

FreechReplies.prototype._queryAndDo = function (cbfunc) {
    
    var currentCounter = 1;
        
    var Freech = this._scope;
    
    var thisReplies = this;
    
    var thisUser = Freech.getUser(this._name);

    thisReplies._data = {};

    thisReplies._lastUpdate=Date.now()/1000;
    
    thisReplies.dhtget([thisUser.getUsername(), "replies"+thisReplies._id, "m"],

        function (result) {

            var FreechPost = require("./FreechPost.js");

            for (i=0; i<result.length; i++) {

                var username = result[i].p.v.userpost.n;
                var id = result[i].p.v.userpost.k;

                thisReplies._data[username+":post"+id]=true;                

                if (! (id in Freech.getUser(username)._stream._posts ) ) {
                
                    Freech.getUser(username)._stream._verifyAndCachePost(result[i].p.v);
                    
                }

            }

            thisReplies._do(cbfunc);

        }
                        
    ); 
        
}

FreechReplies.prototype.doPosts = function (cbfunc) {

    var posts = [];
	
    for (var key in this._data) {

        var nandk = key.split(":post");
        var username = nandk[0];
        var id = parseInt(nandk[1]);
        
		posts.push(Freech.getUser(username).getPost(id));
		
    }
	
	cbfunc(posts);

}

module.exports = FreechReplies;