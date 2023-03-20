'use strict';

/**
 * Freech singleton class descriping the state fo the Freech network.
 * @module
 */

var Bitcoin = require('bitcoinjs-lib');
var freech_network = Bitcoin.networks.bitcoin;
freech_network.messagePrefix= '\x18freech Signed Message:\n';

var FreechResource = require("./FreechResource.js");
var Freech = new FreechResource("freech",{});

Freech._scope = Freech;
Freech._type = "freech";
Freech._hasParentUser = false;

Freech._userCache = {};
Freech._hashtags = {};
Freech._wallet = {};

Freech._activeDHTQueries = 0;
Freech._maxDHTQueries = 5;

Freech._signatureVerification = "background";
Freech._averageSignatureCompTime = 200;
Freech._signatureVerificationsInProgress = 0;

//default query settings:
Freech._outdatedLimit = 45;
Freech._querySettingsByType = {};
Freech._logfunc = function(){};
Freech._host = "http://user:pwd@127.0.0.1:4032";
Freech._timeout = 20000;
Freech._errorfunc = function(error) {
  console.log("Freech error: "+error.message);
};

Freech._walletType = "server";

var availableOptions = ["host","timeout","errorfunc","signatureVerification",
                        "querySettingsByType","maxDHTQueries","walletType","logfunc"];

var FreechPromotedPosts = require("./FreechPromotedPosts.js");
Freech._promotedPosts = new FreechPromotedPosts(Freech);

/** @function
 * @name init 
 * @param {string} options.host endpoint for JSON-RPC queries used by default
 * @param {int} options.timeout timeout for JSON-RPC in milliseconds
 * @param {function} options.errorfunc called when JSON-RPC error occurs
 * @param {bool} options.verifySignatures possible options are "none","instant" and "background". Default is "background"
 * @param {bool} options.querySettingsByType 
 * @param {bool} options.maxDHTQueries
 */
Freech.setup = function (options) {

	for (var key in options) {
		
		if (availableOptions.indexOf(key)>-1) {
			
    		Freech["_"+key] = options[key];
			
		}
	
	}

}

Freech.getQuerySetting = function(key){
  if(availableOptions.indexOf(key)>-1){
    return Freech["_"+key];
  }
}

/** @function
 * @name getUser 
 * @description Creates FreechUser object if not a present in cache and return it.
 * @param {string} username
 */
Freech.getUser = function (username) {
    
    if (username) {
    
        if (Freech._userCache[username] === undefined) {

            var FreechUser = require('./FreechUser.js');

            Freech._userCache[username] = new FreechUser(username,Freech);

        }

        return Freech._userCache[username];
        
    }

}

/** @function
 * @name getUser 
 * @description Creates {@link FreechUser} object if not a present in cache and return it.
 * @param {string} username
 */
Freech.getHashtag = function (tag) {

    if (Freech._hashtags[tag] === undefined) {
    
        var FreechHashtag = require('./FreechHashtag.js');
        
        Freech._hashtags[tag] = new FreechHashtag(tag,Freech);

    }
    
    return Freech._hashtags[tag];
    
}

/** @function
 * @name doHashtagPosts 
 * @description Creates {@link FreechUser} object if not a present in cache and return it.
 * @param {string} tag
 * @param {function} cbfunc callback function. Gets called with an array of {@link FreechPost} objects as parameter.
 * @param {Object} querySettings {@see getQuerySettings}
 */
Freech.doHashtagPosts = function (tag,cbfunc,querySettings) {
    Freech.getHashtag(tag)._checkQueryAndDo(cbfunc,querySettings);
}

/** @function
 * @name getPromotedPosts 
 * @description returns the {@link FreechPromotedPosts} object.
 */
Freech.getPromotedPosts = function() {
	return Freech._promotedPosts;
}

/** @function
 * @name getAccount 
 * @description returns the {@link FreechAccount} object for a given user. The user must already be loaded (except for the "guest" user). To load wallets from the server use loadServerAccounts.
 */
Freech.getAccount = function (name) {
	
	if(name=="guest" && !("guest" in Freech._wallet) && Freech._walletType=="server" ) {
	
		var FreechAccount = require('./ServerWallet/FreechAccount.js');
        
        Freech._wallet["guest"] = new FreechAccount("guest",Freech);
		
	}
	
	return Freech._wallet[name];
}

/** @function
 * @name getAccounts 
 * @description returns an array with all current {@link FreechAccount} objects. To load wallets from the server use loadServerAccounts.
 */
Freech.getAccounts = function () {
	
  var res = [];
  
  for (var acc in Freech._wallet) {
    res.push(Freech._wallet[acc]);
  }
  
  return res;
  
}

/** @function
 * @name loadAccounts 
 * @description loads available account into the wallet. 
 */
Freech.loadServerAccounts = function (cbfunc) {
	
	Freech.RPC("listwalletusers", [], function(res){
	
		var FreechAccount = require('./ServerWallet/FreechAccount.js');
		
		if (res.length) {
		
			for (var i=0; i<res.length; i++) {
			
				if (!(res[i] in Freech._wallet)) {
					Freech._wallet[res[i]] = new FreechAccount(res[i],Freech);
				}
			
			}
			
		
		} else {
		
			Freech._handleError({
              message: "No wallet users found on the server.",
              code: 32081
            })
		
		}
		
		cbfunc(res)

	},  function(res){

		Freech._handleError(res);

	});

}

/** @function
 * @name importClientSideAccount 
 * @description imports an account into client side wallet. The private key is not send to any server. 
 */
Freech.importClientSideAccount = function (name,key,cbfunc) {
	
  var FreechAccount = require('./ClientWallet/FreechAccount.js');

  Freech._wallet[name] = new FreechAccount(name,Freech);

  Freech._wallet[name]._privkey.setKey(key)
  Freech._wallet[name]._privkey.verifyKey(function(key){

    if(key.getStatus()=="confirmed"){
      
      if(cbfunc) cbfunc(Freech._wallet[name])
      
    }else{
      
      Freech._handleError({
        message: "Private key is in conflict with public key.",
        code: 32064
      })
      
    }
    
    
  })
  
}

/** @function
 * @name importClientSideAccount 
 * @description imports an account into client side wallet. The private key is not send to any server. 
 */
Freech.importClientSideAccountFromEncryptedKey = function (name,encryptedKey,passphrase,cbfunc) {
	
  var FreechAccount = require('./ClientWallet/FreechAccount.js');

  Freech._wallet[name] = new FreechAccount(name,Freech);

  Freech._wallet[name]._privkey.decryptAndImportPrivateKey(encryptedKey,passphrase,function(){
    
    Freech._wallet[name]._privkey.verifyKey(function(key){

      if(key.getStatus()=="confirmed"){

        if(cbfunc) cbfunc(Freech._wallet[name])

      }else{

        Freech._handleError({
          message: "Private key is in conflict with public key.",
          code: 32064
        })

      }


    })
    
  })
  
  
}


/** @function
 * @name generateServerSideAccount
 * @descriptions makes a rpc request and creates an account & recieves key pair from a freech server.
 */

 Freech.generateServerSideAccount =  function (name,cbfunc) {

     var FreechAccount = require('./ServerWallet/FreechAccount.js');
     Freech._wallet[name] = new FreechAccount(name,Freech);

     this.checkUsernameAvailable(name, function(AccountAvailability) { 

	     if (AccountAvailability)
	     {
	        //console.log ("creating account");
     
		 Freech._wallet[name].createUser(name, cbfunc);
		 
	     } 
     }) 
}

/*
 * @name publishServerSideAccount
 * @descriptions publishes a user from the local wallet onto the freech network
 */

Freech.publishServerSideAccount = function (name,cbfunc) {

     var FreechAccount = require('./ServerWallet/FreechAccount.js');
     Freech._wallet[name] = new FreechAccount(name,Freech);
     Freech._wallet[name].propagateUser(name, function(result){ return result});
}

/** @function
 * @name generateClientSideAccount 
 * @description generate an account in the client side wallet. The private key is not send to any server. 
 */
Freech.generateClientSideAccount = function (name,cbfunc) {
	
  var FreechAccount = require('./ClientWallet/FreechAccount.js');

  Freech._wallet[name] = new FreechAccount(name,Freech);

  var newAccount = Freech._wallet[name];
  
  newAccount._privkey.makeRandomKey()
  newAccount._privkey.verifyKey(function(){

    var pubkey = newAccount._privkey.getPubKey();
    
    Freech.RPC("createrawtransaction",[name,pubkey],function(raw){
      
      console.log("raw transaction: ",raw);
      
      Freech.RPC("sendrawtransaction",[raw],function(res){
        
        console.log("sent transaction",res);
      
        var freechPubKey = Freech.getUser(name)._pubkey
        
        freechPubKey._lastUpdate = Date.now()/1000;

        freechPubKey._data = pubkey;

        freechPubKey._btcKey = Bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(pubkey,"hex"),freech_network);
        
        var freechStream= Freech.getUser(name)._stream
        
        freechPubKey._lastUpdate = Date.now()/1000;

        freechPubKey._latestId = 0;
        
        if(cbfunc) cbfunc(newAccount)
        
      },function(err){
      console.log("error",err);
      })
    },function(err){
      console.log("error",err);
    })
    
    
  })
  
}

/** @function
 * @name checkUsernameAvailable 
 * @description checks if username is available by querying for its public key.
 */
Freech.checkUsernameAvailable = function(username,cbfunc){
  
  Freech.RPC("dumppubkey",[username],function(pubkey){
          
    if(pubkey.length){
      //console.log( "key found " + pubkey);
      cbfunc(false);
    }else{
      //console.log("no key found " + pubkey)
      cbfunc(true);
    }
    
  },function(error){
    
  });
  
}


/** @function
 * @name checkUsernameAvailable 
 * @description checks if username is available by querying for its public key.
 */
Freech.removeAccount = function(username){
  
  delete Freech._wallet[username];
  
}

/** @function
 * @name serializeCache 
 * @description Flattens the complete cache into a nested object which can be used to reload the cache later.
 */
Freech.serializeCache = function () {

    var retUser = [];
    
    for (var username in this._userCache){
        retUser.push(this._userCache[username].flatten());
    }
    
    var wallet = [];
    
    for (var username in this._wallet){
        wallet.push(this._wallet[username].flatten());
    }
    
    var hashs = [];
    
    for (var tag in this._hashtags){
        hashs.push(this._hashtags[tag].flatten());
    }
    
    var options = {};
    
    for(var i in availableOptions) {
        options[availableOptions[i]]=Freech["_"+availableOptions[i]];        
    }
    
    var promotedPosts =  this._promotedPosts.flatten();
    
    return {
        users: retUser,
        hashtags: hashs,
        options: options,
        wallet: wallet,
        promotedPosts: promotedPosts
           };
}

/** @function
 * @name serializeCache 
 * @description Reloads the cache from a flattened cache object
 */
Freech.deserializeCache = function (flatData) {

    if (flatData) {

        Freech.setup(flatData.options);
        
        if (Freech._walletType=="server")
        {
            var FreechAccount = require('./ServerWallet/FreechAccount.js');
        } 
        else if (Freech._walletType=="client") 
        {
            var FreechAccount = require('./ClientWallet/FreechAccount.js');
        }
        else 
        {
            Freech._handleError({
              message: "Unsupported wallet type.",
              code: 32080
            })
            return;
        }

        for(var i in flatData.wallet){

            var newacc = new FreechAccount(flatData.wallet[i].name,Freech);
            newacc.inflate(flatData.wallet[i]);
            this._wallet[flatData.wallet[i].name]=newacc;

        }        
        
        var FreechUser = require('./FreechUser.js');

        for(var i in flatData.users){

            var newuser = new FreechUser(flatData.users[i].name,Freech);
            newuser.inflate(flatData.users[i]);
            this._userCache[flatData.users[i].name]=newuser;

        }

        var FreechHashtag = require('./FreechHashtag.js');

        for(var i in flatData.hashtags){

            var newhashtag = new FreechHashtag(flatData.hashtags[i].name,Freech);
            newhashtag.inflate(flatData.users[i]);
            this._hashtags[flatData.hashtags[i].name]=newhashtag;

        }
                
        this._promotedPosts.inflate(flatData.promotedPosts);

    }
    
}

Freech.trimCache = function (timestamp) {
    
  for (var username in this._userCache){
      this._userCache[username].trim(timestamp);
  }

  for (var username in this._wallet){
      this._wallet[username].trim(timestamp);
  }

  for (var tag in this._hashtags){
      this._hashtags[tag].trim(timestamp);
  }
  
  this._promotedPosts.trim(timestamp);

}

Freech._activeQueryIds = {};

Freech.raiseQueryId = function (id) {

  console.log("raise id ",id)
  
  if (id) {
    if(!Freech._activeQueryIds[id]){
      Freech._activeQueryIds[id]={func:null,count:1};
    }else{
      Freech._activeQueryIds[id].count++;
    }
  }

}

Freech.bumpQueryId = function (id) {
    
  console.log("bump id ",id)
  
  if (id) {
    Freech._activeQueryIds[id].count--;
    if (Freech._activeQueryIds[id].count==0) {
      if (Freech._activeQueryIds[id].func) { 
        Freech._activeQueryIds[id].func(); 
      }
      delete Freech._activeQueryIds[id];
    }
  }
  
}

Freech.onQueryComplete = function (id, cbfunc){
  
  console.log("complete id ",id)
  
  if(!Freech._activeQueryIds[id]){
    Freech._activeQueryIds[id]={func:cbfunc,count:0};
  }else{
    Freech._activeQueryIds[id].func=cbfunc;
  }

}

module.exports = Freech;
