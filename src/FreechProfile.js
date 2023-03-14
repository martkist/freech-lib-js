var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

/**
 * Describes the profile of a {@link FreechUser}.
 * @class
 */
var FreechProfile = function (name,scope) {
    
    FreechResource.call(this,name,scope);
    
    this._type = "profile";

    
}

inherits(FreechProfile,FreechResource);

module.exports = FreechProfile;

FreechProfile.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisUser = this._scope.getUser(this._name);

    var FreechProfile = require("./FreechProfile.js");
    
    thisUser._profile = new FreechProfile(this._name,this._scope);
    
  }

}

FreechProfile.prototype._queryAndDo = function (cbfunc) {

    var thisResource = this;
    
    var Freech = this._scope;
    
    //console.log("before dhtget"+thisResource._name+" "+thisResource._type)
                                
    thisResource.dhtget([thisResource._name, "profile", "s"],
                   
        function (result) {

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
 * @name getAllFields 
 * @description returns the complete profile as Object
 */
FreechProfile.prototype.getAllFields = function () {

    return this._data;
    
}

FreechProfile.prototype.getUsername = function () {
  return this._name;
}

/** @function
 * @name getField 
 * @description returns a single field of the profile
 */
FreechProfile.prototype.getField = function (fieldname) {
  
  if (this._data) {
    return this._data[fieldname];
  } else { return null }
    
}