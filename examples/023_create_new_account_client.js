/*
 * example of creating a new user on the client side
 * pubkey is sent to the freechnetwork
 * privkey is generated client side
 */


var FreechLocal =  require("../src/Freech.js");


// you may get a timeout - increase it like so
FreechLocal._timeout = 1000000;

FreechLocal.generateClientSideAccount( 'testytester1' ,
       function(result){

              console.log("your priv key : " +  result._privkey._data  );
        });
