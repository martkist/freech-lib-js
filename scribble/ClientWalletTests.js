
Freech = require("../src/Freech.js");

//Freech.setup({logfunc: function(l){console.log(l)}})

Freech.importClientSideAccount("pampalulu","L12kz6tabDN6VmPes1rfEpiznztPF6vgkHp8UZVBgZadxzebHhAp",function(){
	
    console.log("blub")
    
	Freech.getAccount("pampalulu").activateTorrents(function(){
      
      console.log(Freech.getAccount("pampalulu")._torrents["pampalulu"]._active)
      
      /*Freech.getAccount("pampalulu").updateProfileFields({location:"fance new location"},function(){
        console.log("yay");
      })*/
      
      /*Freech.getAccount("pampalulu").post(
        "another test with a mention @martkistdevs and hashtag #blub",function(post){

          //Freech.getUser("pampalulu").doStatus(function(post){
            console.log(post.getContent())
          //});

      });*/
      
      Freech.getAccount("pampalulu").unfollow(
        "rysiek",function(fols){
            console.log(fols)
        }
      );
      
      /*var post = {
        msg: "test"
      };
      
      Freech.getAccount("pampalulu")._signAndAddToTorrent(post,function(){
        console.log("yay");
      })*/
      
      /*Freech.getAccount("timbuktu").reply("martkistdevs",34,
        "test reply from node using freech-lib-js",function(post){
        
          Freech.getUser("timbuktu").doStatus(function(){
            console.log(post.getContent())
          });

      });
      
      Freech.getAccount("timbuktu").retwist("martkistdevs",34,function(post){
        
          Freech.getUser("timbuktu").doStatus(function(){
            
            console.log(post.getRetwistedContent())
            
          });

      });*/
      
    });

});
