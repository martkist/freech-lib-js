var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the retwists of a {@link FreechPost}.
 * @class
 */
var FreechRetwists = function (name,id,scope) {
    
    FreechResource.call(this,name,scope);
    this._type = "retwists";
    this._id = id;
    this._data = {};
    
}

inherits(FreechRetwists,FreechResource);

FreechRetwists.prototype.flatten = function () {

    var flatData = FreechResource.prototype.flatten.call(this);
    
    flatData.id  = this._id;
    
    return flatData;


}

FreechRetwists.prototype.inflate = function (flatData) {
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._id = flatData.id;

}

FreechRetwists.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisPost = this._scope.getUser(this._name).getPost(this._id);

    var FreechRetwists = require("./FreechRetwists.js");
    
    thisPost._retwists = new FreechRetwists(this._name,this._id,this._scope);
    
  }

}

FreechRetwists.prototype._do = function (cbfunc) {
	this.doPosts(cbfunc);
}

FreechRetwists.prototype._queryAndDo = function (cbfunc) {
    
    var currentCounter = 1;
        
    var Freech = this._scope;
    
    var thisRetwists = this;
    
    var thisUser = Freech.getUser(this._name);

    thisRetwists._data = {};

    thisRetwists._lastUpdate=Date.now()/1000;
        
    thisRetwists.dhtget([thisUser.getUsername(), "rts"+thisRetwists._id, "m"],

        function (result) {

            var FreechPost = require("./FreechPost.js");

            for (i=0; i<result.length; i++) {

                var username = result[i].p.v.userpost.n;
                var id = result[i].p.v.userpost.k;

                thisRetwists._data[username+":post"+id]=true;                

                if (! (id in Freech.getUser(username)._stream._posts ) ) {
                
                    Freech.getUser(username)._stream._verifyAndCachePost(result[i].p.v);
                    
                }

            }
        
            thisRetwists._do(cbfunc);

        }
                        
    ); 
        
}

FreechRetwists.prototype.doPosts = function (cbfunc) {

    var posts = [];
	
    for (var key in this._data) {

        var nandk = key.split(":post");
        var username = nandk[0];
        var id = parseInt(nandk[1]);
        
		posts.push(this._scope.getUser(username).getPost(id));
		
    }
	
	cbfunc(posts);
}

module.exports = FreechRetwists;