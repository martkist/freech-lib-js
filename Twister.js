'use strict';

var Twister = {};

Twister._cache = {};

Twister._activeDHTQueries = 0;
Twister._maxDHTQueries = 5;


Twister.RPC = function (method, params, resultFunc, resultArg, errorFunc, errorArg) {
    var foo = new $.JsonRpcClient({ 
        ajaxUrl: "http://twister-proxy.tschaul.com",
        timeout: 20000
    });
    foo.call(method, params,
        function(ret) { if(typeof resultFunc === "function") resultFunc(ret); },
        function(ret) { if(typeof errorFunc === "function" && ret != null) errorFunc(ret); }
    );
}

Twister.dhtget = function (args,cbfunc) {

    if ( Twister._activeDHTQueries < Twister._maxDHTQueries ) {
    
        Twister._activeDHTQueries++;
        
        Twister.RPC("dhtget", args, function(post){
            
            Twister._activeDHTQueries--;
            cbfunc(post);
        
        }, function(ret) {
            
            Twister._activeDHTQueries--;
            console.log(ret);
            
        });
        
    } else {
        
        //console.log("delayed dht query");
        
        setTimeout(function(){
        
            Twister.dhtget(args,cbfunc);
            
        },200);
    
    }

}

Twister.getUser = function (initval) {

    if (Twister._cache[initval] === undefined) {
            
        Twister._cache[initval] = new TwisterUser(initval);

    }
    
    return Twister._cache[initval];

}

Twister.getUsers = function (names) {

    var users = new TwisterUsers(names);
    return users;

}

Twister.serializeCache = function () {

    var retUser = [];
    
    for (var username in this._cache){
        retUser.push(this._cache[username].flatten());
    }
    
    return {users: retUser};


}

Twister.deserializeCache = function (flatData) {

    for(var i = 0; i < flatData.users.length; i++){
        
        var newuser = new TwisterUser(flatData.users[i].name);
        newuser.inflate(flatData.users[i]);
        this._cache[flatData.users[i].name]=newuser;
    
    }
}
