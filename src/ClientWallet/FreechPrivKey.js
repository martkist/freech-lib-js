var inherits = require('inherits');

var FreechResource = require('../FreechResource.js');

var Bitcoin = require('bitcoinjs-lib');
var Crypto = require('crypto');
var buffer = require('buffer').Buffer;
var bencode = require('bencode');
var Bip38 = require('bip38');

/*var Bitcoin = require('bitcoinjs-lib');
var Crypto = require('crypto');
var buffer = require('buffer').Buffer;
var bencode = require('bencode');
var request = require('request');
var wif = require('wif');
var BigInteger = require('bigi');
var bs58check = require('bs58check');*/

var freech_network = Bitcoin.networks.bitcoin;

freech_network.messagePrefix= '\x17freech Signed Message:\n';

/**
 * Describes the public key of a user.
 * @class
 */
var FreechPrivKey = function (name,scope) {
    
    this._name = name;

    FreechResource.call(this,name,scope);   
    
    this._type = "privkey";
  
    this._verified = true;

    this._status =  "unchecked";
  
    this._createdAt = Date.now()/1000;
  
}

inherits(FreechPrivKey,FreechResource);

module.exports = FreechPrivKey;

FreechPrivKey.prototype.flatten = function () {

  var flatData = FreechResource.prototype.flatten.call(this);

  flatData.status = this._status;
  flatData.createdAt = this._createdAt;

  return flatData;
    
}

FreechPrivKey.prototype.inflate = function (flatData) {

    FreechResource.prototype.inflate.call(this,flatData);

    this._status = flatData.status;
    this._createdAt = flatData.createdAt;
  
    if (this._data) {
    
        this._btcKey = Bitcoin.ECPair.fromWIF(this._data,freech_network);
    
    }

}

FreechPrivKey.prototype.trim = function (timestamp) {

}

FreechPrivKey.prototype.getStatus = function () {
  
  return this._status || "unchecked";
  
}

FreechPrivKey.prototype.getCreatedAt = function () {
  
  return this._createdAt;
  
}

FreechPrivKey.prototype.getKey = function () {

    return this._data;
    
}

FreechPrivKey.prototype.setKey = function (key) {

  this._data = key;

  if (this._data) {
    this._btcKey = Bitcoin.ECPair.fromWIF(this._data,freech_network);
  }else{
    this._btcKey = null;
  }
  
}

FreechPrivKey.prototype.makeRandomKey = function (key) {

  this._btcKey = Bitcoin.ECPair.makeRandom(freech_network);
  
  this._data = this._btcKey.toWIF();
  
}

FreechPrivKey.prototype.verifyKey = function (cbfunc) {
  
  var Freech = this._scope;
  
  var thisResource = this;
  
  thisResource.RPC("dumppubkey",[thisResource._name],function(result){
          
    if(result.length){
      
      if(result==thisResource.getPubKey()){
        
        thisResource._status = "confirmed";
        
      }else{
        
        thisResource._status = "conflicting";
        
      }
      
      
    }else{
      
      thisResource._status = "unconfirmed";
      
    }
    
    if(cbfunc) cbfunc(thisResource);
    
  },function(error){
    thisAccount._handleError(error);
  })
  
}

FreechPrivKey.prototype.getPubKey = function() {
  
  return this._btcKey.getPublicKeyBuffer().toString("hex");
  
}

FreechPrivKey.prototype._queryAndDo = function (cbfunc) {
	          
  var thisResource = this;

  setTimeout(function(){
    
    if(thisResource._data!=null && thisResource._btcKey==null){
      
      thisResource._btcKey = Bitcoin.ECPair.fromWIF(thisResource._data,freech_network);
      
    }

    thisResource._lastUpdate = Date.now()/1000;

    if (cbfunc) {

      cbfunc(thisResource);

    }
    
  });
   
}

FreechPrivKey.prototype.sign = function (message_ori, cbfunc) {

  var thisResource = this;

  var message = JSON.parse(JSON.stringify(message_ori));

  if ("p" in message && (typeof message.p)=="object"){ 
    if ("v" in message.p && (typeof message.p.v)=="object"){ 
      if("sig_userpost" in message.p.v && !Buffer.isBuffer(message.p.v.sig_userpost)) {
        message.p.v.sig_userpost = new Buffer(message.p.v.sig_userpost, 'hex');
      }
      if ("userpost" in message.p.v) { 
        if ("sig_rt" in message.p.v.userpost && !Buffer.isBuffer(message.p.v.userpost.sig_rt)) {
          message.p.v.userpost.sig_rt = new Buffer(message.p.v.userpost.sig_rt, 'hex');
        }
      }
    }
  }
  
  
  if ("v" in message && (typeof message.v)=="object"){ 
    if("sig_userpost" in message.v && !Buffer.isBuffer(message.v.sig_userpost)) {
      message.v.sig_userpost = new Buffer(message.v.sig_userpost, 'hex');
    }
    if ("userpost" in message.v) { 
      if ("sig_rt" in message.v.userpost && !Buffer.isBuffer(message.v.userpost.sig_rt)) {
        message.v.userpost.sig_rt = new Buffer(message.v.userpost.sig_rt, 'hex');
      }
    }
  }

  if ("sig_rt" in message && !Buffer.isBuffer(message.sig_rt)) {
    message.sig_rt = new Buffer(message.sig_rt, 'hex');
  } 
  if("sig_userpost" in message && !Buffer.isBuffer(message.sig_userpost)) {
    message.sig_userpost = new Buffer(message.sig_userpost, 'hex');
  }

  var Freech = this._scope;

  var keyPair=this._btcKey;

  setTimeout(function(){

    var startTime = Date.now();

    //console.log("signing",message);
    
    bmessage = bencode.encode(message);

    try {
      var retVal = Bitcoin.message.sign(keyPair,bmessage ,freech_network);
      cbfunc(retVal,message)
    } catch(e) {
      //console.log(e)
      thisResource._handleError({
        code: 123,
        message:"post signing went sideways"
      });
    }

  },0);

}

FreechPrivKey.prototype.encryptPrivateKey = function(passphrase,cbfunc,progressfunc){
 
  var thisResource = this;
  
  setTimeout(function(){
    
    var privateKeyWif = thisResource._btcKey.toWIF()

    var bip38 = new Bip38();
    var encrypted = bip38.encrypt(privateKeyWif, passphrase, thisResource._btcKey.getAddress(), progressfunc)
    cbfunc(encrypted);
    
  },100)
   
}

FreechPrivKey.prototype.decryptAndImportPrivateKey = function(encryptedKey,passphrase,cbfunc,progressfunc){
 
  var thisResource = this;
  
  setTimeout(function(){
    
    var bip38 = new Bip38();
    var privateKeyWif = bip38.decrypt(encryptedKey, passphrase, progressfunc)
    thisResource.setKey(privateKeyWif);
    cbfunc(thisResource);
    
  },100)
   
}

FreechPrivKey.prototype.decrypt = function(message_ori,cbfunc){
  
  var thisResource = this;
  
  setTimeout(function(){
    
    var sec_key = message_ori.userpost.dm.key;
    var sec_body = message_ori.userpost.dm.body;
    var sec_mac = message_ori.userpost.dm.mac;
    var sec_orig = message_ori.userpost.dm.orig;

    if (!Buffer.isBuffer(sec_key)) {
        sec_key = new Buffer(sec_key, "hex");
    }
    if (!Buffer.isBuffer(sec_body)) {
        sec_body = new Buffer(sec_body, "hex");
    }
    if (!Buffer.isBuffer(sec_mac)) {
        sec_mac = new Buffer(sec_mac, "hex");
    }

    var pubkey = Bitcoin.ECPair.fromPublicKeyBuffer(sec_key)
    var secret = pubkey.Q.multiply(thisResource._btcKey.d).getEncoded().slice(1,33)

    var hash_secret = Crypto.createHash('sha512').update(secret).digest()
    var aes_key = hash_secret.slice(0,32)

    var hmac_key = hash_secret.slice(32,64)

    var hmac=Crypto.createHmac("sha512",hmac_key)
    hmac.update(sec_body)
    var hmac_val = hmac.digest()

    if(sec_mac.toString()!=hmac_val.toString()){

      thisResource._handleError({
        message: "Post could not be decrypted.",
        code: 32063
      })

    }else{

      try{
        // note: new Buffer(16) does not give an empty (all zero) buffer
        var iv = new Buffer("00000000000000000000000000000000","hex");
        var decrypter = Crypto.createDecipheriv("aes-256-cbc",aes_key,iv)
        decrypter.setAutoPadding()
        var out = [];
        out.push(decrypter.update(sec_body))
        out.push(decrypter.final())
        var decrypted = bencode.decode(Buffer.concat(out).slice(0,sec_orig));

        for(var key in decrypted){
          if(Buffer.isBuffer(decrypted[key])){
            decrypted[key] = decrypted[key].toString();
          }
        }

        cbfunc(decrypted)

      }catch(e){
        thisResource._handleError({
          message: "Post could not be decrypted",
          code: 32063
        })
      }
    }
    
  },0)

}