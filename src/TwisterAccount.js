var inherits = require('inherits');

var TwisterResource = require('./TwisterResource.js');

function TwisterAccount(name,scope) {
    
	TwisterResource.call(this,name,scope);
	
    this._name = name;
    this._scope = scope;
	
    this._type = "wallet";
	this._hasParentUser = false;
    
	this._wallettype = "serverside";
	
	this._privateFollowings = [];
	
	this._directmessages = {};

}

module.exports = TwisterAccount;

inherits(TwisterAccount,TwisterResource);

TwisterAccount.prototype.flatten = function () {

    return {
        
        name: this._name,
		wallettype: this._wallettype
        
    };


}

TwisterAccount.prototype.inflate = function (flatData) {
    
    this._name = flatData.name;
    this._serverSide = flatData.serverSide;
    this._active = flatData.active;

}

TwisterAccount.activateTorrents = function () {

	var Twister = this._scope;
    
    var thisAccount = this;

    thisAccount.RPC("getfollowing", [ this._name ], function(res) {
        
		for (var i=0; i<res.length; i++) {
		
			var torrent = Twister.getUser(res[i]).getTorrent();
            
            torrent._active = true ;
            torrent._followingName = thisAccount.name ;
       
        	torrent._lastUpdate = Date.now()/1000;
			
		}
        
    }, function(ret) {
        
        thisAccount._handleError(ret);
        
    });

}

TwisterAccount.prototype.updateProfile = function (newdata) {

	var thisAccount = this;
    
    var Twister = this._scope;
    
    Twister.getUser(this._name).doProfile(function(profile){
	
		thisAccount.RPC("dhtput",[
			thisAccount._name,
			"profile",
			"s",
			JSON.stringify(newdata),
			thisAccount._name,
			profile._revisionNumber+1
		],function(result){
		
		},function(error){
			TwisterAccount._handleError(error);
		});
	
	})

}

TwisterAccount.prototype.updateAvatar = function (newdata) {

	var thisAccount = this;
    
    var Twister = this._scope;
    
    Twister.getUser(this._name).doAvatar(function(avatar){
	
		thisAccount.RPC("dhtput",[
			thisAccount._name,
			"profile",
			"s",
			JSON.stringify(newdata),
			thisAccount._name,
			avatar._revisionNumber+1
		],function(result){
		
		},function(error){
			TwisterAccount._handleError(error);
		});
	
	})

}

TwisterAccount.prototype.getDirectMessages = function (username) {

	if ( !(username in this._directmessages) ){
	
		var TwisterDirectMessages = require("./TwisterDirectMessages.js");
		
		var newdmsgs = new TwisterDirectMessages(this._name,username,this._scope);
		
		this._directmessages[username] = newdmsgs;
	
	}
	
	return this._directmessages[username];

}