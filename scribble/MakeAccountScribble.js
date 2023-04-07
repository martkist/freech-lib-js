
var Freech = require("../src/Freech.js");
var Bitcoin = require('bitcoinjs-lib');

var freech_network = Bitcoin.networks.bitcoin;

freech_network.messagePrefix= '\x17freech Signed Message:\n';

var keypair = Bitcoin.ECPair.makeRandom(freech_network);
pubkey = keypair.getPublicKeyBuffer().toString('hex');
privkey = keypair.toWIF();

console.log(pubkey);
console.log(privkey);

var blub = Bitcoin.ECPair.fromWIF(privkey,freech_network);

console.log(blub.getPublicKeyBuffer().toString('hex'));

//Freech.setup({logfunc: function(l){console.log(l)}})

/*Freech.RPC("createrawtransaction",[username,pubkey],function(raw){
  console.log("raw transaction: ",raw);
  Freech.RPC("sendrawtransaction",raw,function(res){
    console.log("sent transaction",res);
    Freech.getUser(username)._doPubKey(function(key){
      console.log("dumppubkey",key);
    })
  },function(err){
  console.log("error",err);
  })
},function(err){
  console.log("error",err);
})*/

