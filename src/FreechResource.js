"use strict";

/**
 * General resource class. Inherited by all objects inside freech-lib-js.
 * @class
 */
function FreechResource (name,scope) {

    this._type = "none";
    this._scope = scope;
    this._name = name;
	this._hasParentUser = true;
  
    this._stash = null;
	
    this._data = null;
    this._verified = false;
    this._lastUpdate = -1;
    this._querySettings = {};
	this._revisionNumber = null;
    
    this._updateInProgress = false;
    this._activeQuerySettings = {};

}

module.exports = FreechResource;

FreechResource.prototype.flatten = function () {

    return { 
        lastUpdate: this._lastUpdate,
        verified: this._verified,
        querySettings: this._querySettings,
        revisionNumber: this._revisionNumber,
        name: this._name,
        data: this._data
    };

}

FreechResource.prototype.inflate = function (flatData) {
    
    this._lastUpdate = flatData.lastUpdate;
	this._verified = flatData.verified;
	this._querySettings = flatData.querySettings;
	this._revisionNumber = flatData.revisionNumber;
    this._name = flatData.name;
    this._data = flatData.data;
	
	if (!this._verified) {this._lastUpdate=-1;}

}

FreechResource.prototype._do =  function (cbfunc) {

    cbfunc(this);

}

FreechResource.prototype.inCache = function () {
    return (this._lastUpdate>0);
}

/**
 * Checks whether cached resource is outdated and invokes an update if needed. Calls cbfunc on the resource when done.
 * @function
 * @param {function} cbfunc callback function
 * @param {Object} querySettings
 */
FreechResource.prototype._checkQueryAndDo = function (cbfunc,querySettings) {
    
    if (querySettings===undefined) {querySettings={};} 
    //else {console.log(querySettings)}
    
    var Freech = this._scope;

    var thisResource = this;
        
    if (!thisResource._updateInProgress) {
        
        thisResource._activeQuerySettings = JSON.parse(JSON.stringify(querySettings));
        thisResource._updateInProgress = true;
        if(thisResource._activeQuerySettings["queryId"]) Freech.raiseQueryId(thisResource._activeQuerySettings["queryId"]);

        var outdatedTimestamp = 0;
      
        outdatedTimestamp = Date.now()/1000 - thisResource.getQuerySetting("outdatedLimit");    

        if ( this._lastUpdate > outdatedTimestamp ){
            
            thisResource._do(cbfunc);
            
            thisResource._log("resource present in cache");
          
            if(thisResource._activeQuerySettings["queryId"]) Freech.bumpQueryId(thisResource._activeQuerySettings["queryId"]);
            thisResource._activeQuerySettings = {};
            thisResource._updateInProgress = false;

        } else {
              
            thisResource._log("resource not in cache. querying");
            
            thisResource._queryAndDo(function(newresource){
                
                thisResource._do(cbfunc);
                
                if(thisResource._activeQuerySettings["queryId"]) Freech.bumpQueryId(thisResource._activeQuerySettings["queryId"]);
                thisResource._activeQuerySettings = {};
                thisResource._updateInProgress = false;
            
            });
            
        }

    } else {
      
        thisResource._log("update in progress "+thisResource._type+" "+thisResource._name)
        
        setTimeout(function(){
        
            thisResource._checkQueryAndDo(cbfunc,querySettings);
            
        },200);
        
    }

} 

/**
 * Retrieve currently set query setting.
 * @function
 * @param {string} settings
 */
FreechResource.prototype.getQuerySetting = function (setting) {

	//console.log(setting,this._activeQuerySettings);
	
    var Freech = this._scope;
    
    if (setting in this._activeQuerySettings) {
        return this._activeQuerySettings[setting];
    }
    
    if (setting in this._querySettings) {
        return this._querySettings[setting];
    }
    
    //console.log(this._type,Freech._querySettingsByType)
  
    if (setting in Freech._querySettingsByType && this._type in Freech._querySettingsByType[setting]) {
        return Freech._querySettingsByType[setting][this._type];
    }
    
    if (this._hasParentUser && setting in Freech.getUser(this._name)._querySettings) {
        return Freech.getUser(this._name)._querySettings[setting];
    }
    
    if ( ("_"+setting) in Freech) {
        return Freech[("_"+setting)];
    }
    
    this._handleError({
      message:"Unknown query setting was requested.",
      code: 32051
    });

}

FreechResource.prototype.setQuerySettings = function (settings) {

    for (var key in settings) {
		
		this._querySettings[key] = settings[key];
		
	}

}

FreechResource.prototype._handleError = function (error) {
    
    this._updateInProgress = false;
    this.getQuerySetting("errorfunc").call(this,error);
    if(this._activeQuerySettings["queryId"])  Freech.bumpQueryId(this._activeQuerySettings["queryId"]);
    this._activeQuerySettings={};
  
}

FreechResource.prototype._log = function (log) {
    
    this.getQuerySetting("logfunc").call(this,log);
    
}

FreechResource.prototype.RPC = function (method, params, resultFunc, errorFunc) {
    
	var thisResource = this;
  
    thisResource._log("calling JSON-RPC "+method+" "+JSON.stringify(params));
	
	if (typeof errorFunc != "function") {
	
		thisResource._activeQuerySettings = errorFunc;
	
	}
    
	//this._activeQuerySettings["method"]=method;
	//this._activeQuerySettings["params"]=params;
	
	//console.log("rpc by "+this._name+" : "+method+" "+JSON.stringify(this._activeQuerySettings))
	
    if ( (typeof $ == "function") && ( typeof $.JsonRpcClient == "function") ) {
        
        var foo = new $.JsonRpcClient({ 
        ajaxUrl: thisResource.getQuerySetting("host"),
        timeout: thisResource.getQuerySetting("timeout")
        });
        foo.call(method, params,
            function(ret) { if(typeof resultFunc === "function") resultFunc(ret); },
            function(ret) { if(typeof errorFunc === "function" && ret != null) errorFunc(ret); }
        );
        
    } else {
                    
        var request = require('request');
        var requestBody = '{"jsonrpc": "2.0", "method": "'+method+'", "params": '+JSON.stringify(params)+', "id": 0}';
        request({
          
            uri: thisResource.getQuerySetting("host"),
            method: "POST",
            timeout: thisResource.getQuerySetting("timeout"),
            followRedirect: true,
            maxRedirects: 10,
            body: requestBody
          
        }, function(error, response, responseBody) {
            
            if (error) { 
				                
                thisResource._handleError({
                    message: "Host not reachable.",
                    data: error.code,
                    code: 32090                    
                  })
			
			} else {
              
              if (response.statusCode<200 || response.statusCode>299) {
                    console.debug("request: %o", requestBody);
                    console.debug("response: %o", responseBody);
                  thisResource._handleError({
                    message: "Request was not processed successfully (http error: "+response.statusCode+").",
                    data: response.statusCode,
                    code: 32091                    
                  })
                  
              } else {
              
                try {
                  
                  var res = JSON.parse(responseBody);
                  
                  
                } catch (err) {

                  thisResource._handleError({
                    message: "An error occurred while parsing the JSON response body.",
                    code: 32092
                  })

                  var res = null;
                }

                if(res){
                  if (res.error) {
                    thisResource._handleError(res.error);
                  } else {
                    resultFunc(res.result);
                  }
                }
                                
              } 
                
            }
            
        });
        
    }
      
}

FreechResource.prototype.dhtget = function (args,cbfunc) {

    var Freech = this._scope;
    
    var thisResource = this;
  
    if ( Freech._activeDHTQueries < Freech._maxDHTQueries ) {
    
        Freech._activeDHTQueries++;
        
        thisResource.RPC("dhtget", args, function(res){
            
            Freech._activeDHTQueries--;
            
            thisResource._log("dhtget result: "+JSON.stringify(res));
          
            if (res[0]) {
				
				var signatureVerification = thisResource.getQuerySetting("signatureVerification");
				
                var signingUser = res[0].sig_user;
                
                if (signatureVerification!="none" 
					&& (args[2]=="m" || (args[0]==signingUser) ) ) {
                  
                    thisResource._log("issuing signature verification");
                  
                    var stash = JSON.parse(JSON.stringify(thisResource.flatten()));
                
                    if (signatureVerification=="background") { cbfunc(res); }

                    Freech.getUser(signingUser)._doPubKey(function(pubkey){

                        pubkey.verifySignature(res[0].p,res[0].sig_p,function(verified){


                            if (verified) {

                                thisResource._verified = true;
								
								if (signatureVerification=="instant") { cbfunc(res); }
								
                            } else {

                                thisResource.inflate(stash);
                              
                                thisResource._handleError({
                                  message: "DHT resource signature could not be verified",
                                  code: 32050
                                })

                            }

                        });

                    });
                    
                } else { 
                  thisResource._verified = true;
                  thisResource._log("no signature verification needed");
                  cbfunc(res); 
                }
                
            } else { 
              thisResource._log("dht resource is empty"); 
              cbfunc(res);
            }
            
        }, function(error) {
            
            Freech._activeDHTQueries--;
            thisResource._handleError(error);
            
        });
        
    } else {
                
        setTimeout(function(){
        
            thisResource.dhtget(args,cbfunc);
            
        },200);
    
    }

}