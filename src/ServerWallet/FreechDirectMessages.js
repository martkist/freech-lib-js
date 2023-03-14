var inherits = require('inherits');

var FreechResource = require('../FreechResource.js');

/**
 * Describes the direct messages between an {@link FreechAccount} and an {@link FreechUser}
 * @class
 */
FreechDirectMessages = function (walletusername,name,scope) {
    
	this._hasParentUser = true;
	
	this._walletusername = walletusername;
	
    FreechResource.call(this,name,scope);
    
    this._latestId = -1;
    this._messages = {};
    
    this._type = "directmessages";

}

inherits(FreechDirectMessages,FreechResource);

FreechDirectMessages.prototype.flatten = function () {

    var flatData = FreechResource.prototype.flatten.call(this);
    
    var flatMessages = [];
    
    for (var id in this._messages){
		
        flatMessages.push(this.flattenMessage(this._messages[id]));
		
    }
    
    flatData.messages = flatMessages;
    flatData.latestId  = this._latestId;  
    flatData.walletusername  = this._walletusername;    
    
    return flatData;

}

FreechDirectMessages.prototype.inflate = function (flatData) {
    
    var FreechPost = require('../FreechPost.js');
    
    FreechResource.prototype.inflate.call(this,flatData);
    
    this._latestId = flatData.latestId;
    this._walletusername = flatData.walletusername;
    
    for(var i = 0; i < flatData.messages.length; i++){
        
        this._messages[messages.id]=this.inflateMessage(flatData.messages[i]);
    
    }

}

FreechDirectMessages.prototype.flattenMessage = function (msg) {

	var flatMsg = {};
	
	flatMsg.id=msg.getId();
	flatMsg.time=msg.getTimestamp();
	flatMsg.text=msg.getContent();
	flatMsg.fromMe=msg.getFromMe();
	
	return flatMsg;

}

FreechDirectMessages.prototype.inflateMessage = function (msg) {

  if (msg.fromMe) {
      msg.sender = this._walletusername;
      msg.receiver = this._name;		
  } else {
      msg.sender = this._name;	
      msg.receiver = this._walletusername;
  }

  var thisDirectMessages = this;

  msg.getId = function () {return this.id};
  msg.getContent = function () {return this.text};
  msg.getSender = function () {return this.sender};
  msg.getReceiver = function () {return this.sender};
  msg.getTimestamp = function () {return this.time};
  msg.doPreviousMessage = function (cbfunc) { thisDirectMessages._doMessage(this.id-1,cbfunc) };

  return msg;

}

FreechDirectMessages.prototype.trim = function (timestamp) {

  for (var id in this._posts) {
      
    if ( id!=this._latestId && ( !timestamp || timestamp > this._messages[id].getTimestamp() ) ) {
      
      delete this._messages[id];
      
    }

  }
  
  var postCount = Object.keys(this._posts).length;
  
  if ( postCount<=1 && (!timestamp || timestamp > this._lastUpdate) ){
    
    if ( this._posts[this._latestId] && (
      !timestamp || timestamp>this._messages[this._latestId].getTimestamp() 
    )) {

      delete this._posts[this._latestId];

    }
    
    var postCount = Object.keys(this._posts).length;

    if (postCount==0) {
    
      var thisAccount = this._scope.getAccount(this._walletusername);

      delete thisAccount._diretmessages[this._name];
      
    }

  } 

}

FreechDirectMessages.prototype._do =  function (cbfunc) {
    
  this._doMessage(this._latestId,cbfunc);
    
}

FreechDirectMessages.prototype._queryAndDo = function (cbfunc) {
    	
    var thisResource = this;
        
	thisResource.RPC("getdirectmsgs", [ thisResource._walletusername , 30 , [{username: this._name}] ], function(res) {
            		
			//console.log(res[thisResource._name]);
		
			if (res[thisResource._name].length>0) {

				for (var i = 0; i<res[thisResource._name].length; i++) {

					thisResource._cacheMessage(res[thisResource._name][i],function(newmsg){

						if ( newmsg.getId() > thisResource._latestId ) {

							thisResource._latestId = newpost.getId();
							thisResource._lastUpdate = Date.now()/1000;

						}

					});

				}
				
				thisResource._do(cbfunc);

			} 

		}, function(ret) {

			thisResource._handleError(ret);

		}
					 
	);
 
        
}

FreechDirectMessages.prototype._cacheMessage =  function (msg,cbfunc) {
	
    var Freech = this._scope;
        
    var thisResource = this;
    
    var newid = msg.id;
    
    if( !( newid in thisResource._messages) ) {

        var FreechDirectMsg = require('../FreechPost.js');

        var newmsg = thisResource.inflateMessage(msg);

        thisResource._messages[newmsg.getId()] = newmsg;
        
        if ( thisResource._latestId<newmsg.getId() ) {
        
            thisResource._latestId=newmsg.getId();
        
        }
        
        if (cbfunc) {
            
            cbfunc(newmsg);

        }
        
    }

}

FreechDirectMessages.prototype._doMessage = function (id,cbfunc, querySettings) {

    var Freech = this._scope;
    
    if (id && id>0) {

        if (id in this._messages){
            
            cbfunc(this._messages[id])
            
        } else {
            
            var thisResource = this;
			         
			thisResource._updateInProgress = true;
			
            thisResource.RPC("getspamposts", [ 30 , id ], function(res) {
            		
					if (res.length>0) {

						for (var i = 0; i<res.length; i++) {

							thisResource._cacheMessage(res[i]);

						}

						cbfunc(thisResource._messages[id])

					} 
				
					thisResource._updateInProgress = false;

				}, querySettings
			);
            
        }
        
    }
    
};

FreechDirectMessages.prototype._doUntil = function (cbfunc, querySettings) {

	this._checkQueryAndDo(function doUntil(message){
	
		var retVal = cbfunc(message);
		
		if( message.getId()!=1 && retVal!==false ) { 
			
			message.doPreviousMessage(doUntil, querySettings); 
			
		}
	
	}, querySettings);
	
}

module.exports = FreechDirectMessages;

