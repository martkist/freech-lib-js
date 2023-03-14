var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the followings of a {@link FreechUser}
 * @module
 */
var FreechFollowings = function (name,scope) {
    
    FreechResource.call(this,name,scope);
    this._type = "followings";
    this._revisionNumber = {};
    
}

inherits(FreechFollowings,FreechResource);

FreechFollowings.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisUser = this._scope.getUser(this._name);

    var FreechFollowings = require("./FreechFollowings.js");
    
    thisUser._followings = new FreechFollowings(this._name,this._scope);
    
  }

}

FreechFollowings.prototype._do= function (cbfunc) {
	this.doUsers(cbfunc);
}

FreechFollowings.prototype._queryAndDo = function (cbfunc) {
        
  var thisResource = this;

  var Freech = this._scope;
  
  var thisStream = Freech.getUser(this._name)._stream;
  
  if (thisStream._activeTorrentUser && thisStream._activeTorrentUser==this._name && Freech._wallet[this._name]._wallettype=="server") {
    
    thisResource._log("using getfollowing rpc method")
    
    var thisAccount = Freech._wallet[this._name];
    
    thisAccount.RPC("getfollowing",[thisAccount._name],function(result){

      thisResource._data = result;
      thisResource._lastUpdate=Date.now()/1000;
      thisResource._do(cbfunc);

    },function(error){
      
      thisResource._handleError(error);
      
    });
    
  } else {
  
    var currentCounter = 1;

    thisResource._data = [];

    thisResource._lastUpdate=Date.now()/1000;

    var requestTilEmpty = function (cbfunc) {

        thisResource.dhtget([thisResource._name, "following"+currentCounter, "s"],
                       
            function (result) {

                if (result[0] && result[0].p.v[0]) {

                    for (var i = 0; i<result[0].p.v.length; i++) {

                        thisResource._data.push(result[0].p.v[i]);

                    }

                    thisResource._revisionNumber[currentCounter]=result[0].p.seq;
                  
                    currentCounter++;
                    requestTilEmpty(cbfunc)

                } else {
                
                    thisResource._do(cbfunc);
                
                }

            }


        ); 

    };  
        
    requestTilEmpty(cbfunc);
    
  }
        
}


/** @function
 * @name getNames 
 * @description returns the usernames of the following users
 */
FreechFollowings.prototype.getNames = function () {

    return this._data;
    
}

/** @function
 * @name doUsers 
 * @description calls cbfunc with every {@link FreechUser} object of the following users.
 * @param {function} cbfunc callback function
 */
FreechFollowings.prototype.doUsers = function(cbfunc) {

    var Freech = this._scope;
    
    var followingNames = this.getNames();
    
	followings = [];
	
    for (var i in followingNames) {

        followings.push(Freech.getUser(followingNames[i]));

    }
	
	cbfunc(followings);

}

module.exports = FreechFollowings;