/* 
 * In the follwoing we provoke an error by requestin the status of a user that does not 
 * exist. The two most common ways of error handling are to either define a global method 
 * that is called for every error ... 
 */

Freech = require('../src/Freech.js')

Freech.setup({errorfunc:function(error){
  console.log("custom freech-wide error function: "+error.code+": "+error.message);
}})

Freech.getUser("7567sdddff334").doStatus(function(post){});

/*
 * ... or to define a query specific method that is run when an error occurs in 
 * that particular query. For more information about the error codes see the README.md
 */

Freech.getUser("7567sdddff334").doStatus(function(post){},{
  errorfunc: function(error){
    console.log("custom query specific error function: "+error.code+": "+error.message);
  }
});

/* 
 * Note that the error function is always called from the context of querying resource.
 * This means that you can access its properties through *this*. Two important properties 
 * of every resource in freech-lib-js are _type and _name, where _name is the name of 
 * the user that the resource is assigned to.
 */

Freech.getUser("7567sdddff334").doStatus(function(post){},{
  errorfunc: function(error){
    console.log(this._type+" of user "+this._name+" threw an error: "+error.code+" "+error.message);
  }
});
