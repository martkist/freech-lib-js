var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the refreechs of a {@link FreechPost}.
 * @class
 */
var FreechRefreechs = function (name,id,scope) {
    
    FreechResource.call(this,name,scope);
    this._type = "refreechs";
    this._id = id;
    this._data = {};
    
}

inherits(FreechRefreechs,FreechResource);

FreechRefreechs.prototype.flatten = function () {

    var flatData = FreechResource.prototype.flatten.call(this);
    
    flatData.id  = this._id;
    
    return flatData;


}

FreechRefreechs.prototype.inflate = function (flatData) {
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._id = flatData.id;

}

FreechRefreechs.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisPost = this._scope.getUser(this._name).getPost(this._id);

    var FreechRefreechs = require("./FreechRefreechs.js");
    
    thisPost._refreechs = new FreechRefreechs(this._name,this._id,this._scope);
    
  }

}

FreechRefreechs.prototype._do = function (cbfunc) {
	this.doPosts(cbfunc);
}

FreechRefreechs.prototype._queryAndDo = function (cbfunc) {
    
    var currentCounter = 1;
        
    var Freech = this._scope;
    
    var thisRefreechs = this;
    
    var thisUser = Freech.getUser(this._name);

    thisRefreechs._data = {};

    thisRefreechs._lastUpdate=Date.now()/1000;
        
    thisRefreechs.dhtget([thisUser.getUsername(), "rts"+thisRefreechs._id, "m"],

        function (result) {

            var FreechPost = require("./FreechPost.js");

            for (i=0; i<result.length; i++) {

                var username = result[i].p.v.userpost.n;
                var id = result[i].p.v.userpost.k;

                thisRefreechs._data[username+":post"+id]=true;                

                if (! (id in Freech.getUser(username)._stream._posts ) ) {
                
                    Freech.getUser(username)._stream._verifyAndCachePost(result[i].p.v);
                    
                }

            }
        
            thisRefreechs._do(cbfunc);

        }
                        
    ); 
        
}

FreechRefreechs.prototype.doPosts = function (cbfunc) {

    var posts = [];
	
    for (var key in this._data) {

        var nandk = key.split(":post");
        var username = nandk[0];
        var id = parseInt(nandk[1]);
        
		posts.push(this._scope.getUser(username).getPost(id));
		
    }
	
	cbfunc(posts);
}

module.exports = FreechRefreechs;