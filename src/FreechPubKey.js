var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');

var Bitcoin = require('bitcoinjs-lib');
var Crypto = require('crypto');
var buffer = require('buffer').Buffer;
var bencode = require('bencode');


var freech_network = Bitcoin.networks.bitcoin;

freech_network.messagePrefix= '\x17freech Signed Message:\n';

/**
 * Describes the public key of a user.
 * @class
 */
var FreechPubKey = function (name,scope) {
    
    this._name = name;
    this._data =  null;
    this._btcKey =  null;

    FreechResource.call(this,name,scope);   
    
    this._type = "pubkey";
  
    this._verified = true;

    
}

inherits(FreechPubKey,FreechResource);

module.exports = FreechPubKey;

FreechPubKey.prototype.inflate = function (flatData) {

    FreechResource.prototype.inflate.call(this,flatData);
    
    if (this._data) {
    
        this._btcKey = Bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(this._data,"hex"),freech_network);
    
    }

}

FreechPubKey.prototype.trim = function (timestamp) {

  if (!timestamp || timestamp > this._lastUpdate){

    var thisUser = this._scope.getUser(this._name);

    var FreechPubKey = require("./FreechPubKey.js");
    
    thisUser._pubkey = new FreechPubKey(this._name,this._scope);
    
  }

}

FreechPubKey.prototype._queryAndDo = function (cbfunc) {
	
    var thisResource = this;
            
    thisResource.RPC("dumppubkey", [ thisResource._name ], function(res) {
      
        if(res.length) {
      
          thisResource._lastUpdate = Date.now()/1000;

          thisResource._data = res;
          
          thisResource._btcKey = Bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(res,"hex"),freech_network);

          if (cbfunc) {

              cbfunc(thisResource);

          }
          
        } else { 
          
          thisResource._handleError({
            message: "Public key not available on server.",
            code: 32061
          }) 
        
        }
		
    }, function(ret) {

        thisResource._handleError(ret);

    });     
        
}

FreechPubKey.prototype.getKey = function () {

    return this._data;
    
}

FreechPubKey.prototype.verifySignature = function (message_ori, signature_ori, cbfunc) {

  var verifySignatures = (this.getQuerySetting("signatureVerification")!="none");
  
  if(verifySignatures){
  
    var thisResource = this;
  
    var signature = JSON.parse(JSON.stringify(signature_ori));

    var message = JSON.parse(JSON.stringify(message_ori));

    if ("v" in message && (typeof message.v)=="object"){ 
        if("sig_userpost" in message.v) {
            message.v.sig_userpost = new Buffer(message.v.sig_userpost, 'hex');
        }
        if ("userpost" in message.v) { 
            if ("sig_rt" in message.v.userpost) {
                message.v.userpost.sig_rt = new Buffer(message.v.userpost.sig_rt, 'hex');
            }
        }
    }

    if ("sig_rt" in message) {
        message.sig_rt = new Buffer(message.sig_rt, 'hex');
    }

    //console.log("verifying message")

    var Freech = this._scope;

    var thisPubKey=this._btcKey;

    Freech._signatureVerificationsInProgress++;

    var timeout=Freech._signatureVerificationsInProgress*Freech._averageSignatureCompTime*4;

    setTimeout(function(){


        var startTime = Date.now();

        message = bencode.encode(message);

        try {
            signature = new Buffer(signature, 'hex');
          try {
            
            var retVal = Bitcoin.message.verify(thisPubKey.getAddress(), signature, message, freech_network);
          } catch(e) {
            var retVal = false;	
            thisResource._log("verification went sideways");
            console.log(e);
          }
        } catch(e) {
          var retVal = false;	
          thisResource._log("signature is malformed");
        }


        var compTime = Date.now()-startTime;

        Freech._averageSignatureCompTime = 0.9*Freech._averageSignatureCompTime + 0.1*compTime;
        
        Freech._signatureVerificationsInProgress--;

        cbfunc(retVal)

    },timeout);

  }else{
    cbfunc(true);
  }

}