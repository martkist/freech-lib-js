var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the avatar of a {@link FreechUser}.
 * @module 
 */
var FreechAvatar = function (name,scope) {
    
    FreechResource.call(this,name,scope);
  
    this._type = "avatar";
    
}

inherits(FreechAvatar,FreechResource);

module.exports = FreechAvatar;

FreechAvatar.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisUser = this._scope.getUser(this._name);

    var FreechAvatar = require("./FreechAvatar.js");
    
    thisUser._avatar = new FreechAvatar(this._name,this._scope);
    
  }

}

FreechAvatar.prototype._queryAndDo = function (cbfunc) {

    var thisResource = this;
    
    var Freech = this._scope;
    
    thisResource.dhtget([thisResource._name, "avatar", "s"],
                   
        function (result) {
         
            thisResource._updateInProgress = false;

            if (result[0]) {

                thisResource._data=result[0].p.v;
                thisResource._revisionNumber=result[0].p.seq;
                thisResource._lastUpdate=Date.now()/1000;
                cbfunc(thisResource);

            } else {
			
				/*thisResource._handleError({
                  message: "DHT resource is empty.",
                  code: 32052
                })*/
                thisResource._revisionNumber=0;
                thisResource._lastUpdate=Date.now()/1000;
                cbfunc(thisResource);
			
			}

        }

    );   
        
}

/** @function
 * @name getUrl 
 * @description return the (data-)url of the avatar
 */
FreechAvatar.prototype.getUrl = function () {

    return this._data;
    
}

/** @function
 * @name getUsername 
 * @description return the username of the owner of the avatar
 */
FreechAvatar.prototype.getUsername = function () {

    return this._name;
    
}