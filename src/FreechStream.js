var inherits = require('inherits');

var FreechResource = require('./FreechResource.js');
//var FreechTorrent = require('./FreechTorrent.js');

/**
 * Describes the stream of posts of a {@link FreechUser}.
 * @class
 */
var FreechStream = function (name, scope) {

  FreechResource.call(this, name, scope);

  this._latestId = -1;
  this._posts = {};
  this._verified = true; //post are verified individually

  this._activeTorrentUser = null;

  this._type = "stream";

}

inherits(FreechStream, FreechResource);

FreechStream.prototype.trim = function (timestamp) {

  for (var id in this._posts) {

    if (id != this._latestId) {

      this._posts[id].trim(timestamp);

    }

  }

  var postCount = Object.keys(this._posts).length;

  if (postCount <= 1 && (!timestamp || timestamp > this._lastUpdate) && !this._activeTorrentUser) {

    if (this._posts[this._latestId]) {

      this._posts[this._latestId].trim();

    }

    var postCount = Object.keys(this._posts).length;

    if (postCount == 0) {

      var thisUser = this._scope.getUser(this._name);

      var FreechStream = require("./FreechStream.js");

      thisUser._stream = new FreechStream(this._name, this._scope);

    }

  }

}

FreechStream.prototype.flatten = function () {

  var flatData = FreechResource.prototype.flatten.call(this);

  var flatPosts = [];

  for (var id in this._posts) {
    flatPosts.push(this._posts[id].flatten());
  }

  flatData.posts = flatPosts;
  flatData.latestId = this._latestId;
  flatData.activeTorrentUser = this._activeTorrentUser;

  return flatData;

}

FreechStream.prototype.inflate = function (flatData) {

  var Freech = this._scope;

  var FreechPost = require('./FreechPost.js');

  FreechResource.prototype.inflate.call(this, flatData);

  this._latestId = flatData.latestId;
  this._activeTorrentUser = flatData.activeTorrentUser;

  for (var i in flatData.posts) {

    if (flatData.posts[i].verified) {

      var newpost = new FreechPost(flatData.posts[i].data, flatData.posts[i].signature, Freech);
      newpost.inflate(flatData.posts[i]);
      this._posts[newpost.getId()] = newpost;

    } else if (flatData.posts[i].data.k == this._latestId) {

      this._latestId = -1;
      this._lastUpdate = -1;

    }

  }

}

FreechStream.prototype._do = function (cbfunc) {

  this._doPost(this._latestId, cbfunc);

}

FreechStream.prototype.updateCache = function (cbfunc) {

  var Freech = this._scope;

  if (this._activeTorrentUser) {
    Freech._wallet[this._activeTorrentUser]._torrents[this._name].updatePostsCache(cbfunc);
  } else {
    this._log("user has no active torrent")
    cbfunc(false);
  }

}

FreechStream.prototype.fillCache = function (id, cbfunc) {

  var Freech = this._scope;

  if (this._activeTorrentUser) {
    Freech._wallet[this._activeTorrentUser]._torrents[this._name].fillPostsCache(id, cbfunc);
  } else {
    cbfunc(false);
  }

}

FreechStream.prototype._queryAndDo = function (cbfunc) {

  var thisResource = this;

  thisResource.updateCache(function (success) {

    if (success) {

      thisResource._log("updating cache with torrent successfull")

      thisResource._do(cbfunc);
      thisResource._updateInProgress = false;

    } else {

      thisResource._log("updating cache with torrent failed")

      thisResource.dhtget([thisResource._name, "status", "s"], function (result) {

        thisResource._log("result from dhtget: " + JSON.stringify(result));

        if (result[0]) {

          thisResource._verifyAndCachePost(result[0].p.v, function (newpost) {

            thisResource._latestId = newpost.getId();
            thisResource._lastUpdate = Date.now() / 1000;
            thisResource._updateInProgress = false;

            cbfunc(newpost);

          });


        } else {

          /*thisResource._handleError({
            message: "DHT resource is empty.",
            code: 32052
          })*/
          thisResource._updateInProgress = false;
          cbfunc(null);

        }

      }

      );

    }

  });

}

FreechStream.prototype._verifyAndCachePost = function (payload, cbfunc) {

  var Freech = this._scope;

  var thisResource = this;

  var newid = payload.userpost.k;
  var payloadUser = payload.userpost.n;

  //console.log(payloadUser+":post"+newid);

  if (!(newid in thisResource._posts)) {

    var signatureVerification = thisResource.getQuerySetting("signatureVerification");

    var FreechPost = require('./FreechPost.js');

    var newpost = new FreechPost(payload.userpost, payload.sig_userpost, Freech);

    thisResource._posts[newpost.getId()] = newpost;

    if (thisResource._latestId < newpost.getId()) {

      thisResource._latestId = newpost.getId();

    }

    if (cbfunc && signatureVerification == "none") {

      thisResource._log("no signature verifcation needed");

      newpost._verified = true;

      cbfunc(newpost);


    } else {

      if (cbfunc && signatureVerification == "background") {

        thisResource._log("issuing signature verification in background");

        cbfunc(newpost);

      }

      var errorfunc = thisResource.getQuerySetting("errorfunc");

      Freech.getUser(thisResource._name)._doPubKey(function (pubkey) {

        pubkey.verifySignature(payload.userpost, payload.sig_userpost, function (verified) {

          if (verified) {

            newpost._verified = true;

            if (newpost.isRefreech()) {

              var post_rt = payload.userpost.rt;
              var sig_rt = payload.userpost.sig_rt;

              Freech.getUser(post_rt.n)._doPubKey(function (pubkey) {

                pubkey.verifySignature(post_rt, sig_rt, function (verified) {

                  if (verified) {

                    if (cbfunc && signatureVerification == "instant") {
                      cbfunc(newpost);
                    }

                  } else {

                    newpost.trim();

                    errorfunc.call(thisResource, {
                      message: "Signature of refreeched post could not be verified.",
                      code: 32062
                    });

                  }

                });

              });

            } else {

              if (cbfunc && signatureVerification == "instant") { cbfunc(newpost); }

            }

          } else {

            newpost.trim();

            errorfunc.call(thisResource, {
              message: "Post signature could not be verified.",
              code: 32060
            });

          }

        });

      });

    }

  } else if (cbfunc) {
    cbfunc(thisResource._posts[newid]);
  }

}

FreechStream.prototype._doPost = function (id, cbfunc, querySettings) {

  if (querySettings === undefined) { querySettings = {}; }

  //console.log(querySettings)

  var Freech = this._scope;

  var thisResource = this;

  if (id && id > -1) {

    if (id in this._posts) {

      cbfunc(this._posts[id])

      this._log("post already in cache");

    } else {

      thisResource._activeQuerySettings = querySettings;
      thisResource._updateInProgress = true;

      this._log("post " + id + " not in cache");

      var thisResource = this;

      thisResource.fillCache(id, function (success) {

        if (success) {

          thisResource._log("fill cache was successfull")

          thisResource._activeQuerySettings = {};
          thisResource._updateInProgress = false;

          cbfunc(thisResource._posts[id])

        } else {

          thisResource.dhtget([thisResource._name, "post" + id, "s"],

            function (result) {

              if (result[0]) {

                thisResource._verifyAndCachePost(result[0].p.v, cbfunc);

              } else {

                /*thisResource._handleError({
                  message: "DHT resource is empty.",
                  code: 32052
                })*/
                thisResource._updateInProgress = false;
                cbfunc(null);

              }

              thisResource._activeQuerySettings = {};
              thisResource._updateInProgress = false;

            }

          );

        }

      });

    }

  } else {
    cbfunc(null);
  }

};

FreechStream.prototype._doUntil = function (cbfunc, querySettings) {

  this._checkQueryAndDo(function doUntil(post) {

    if (post) {

      var retVal = cbfunc(post);

      if (post.getLastId() && retVal !== false) {

        post.doPreviousPost(doUntil, querySettings);

      }

    }

  }, querySettings);

}

module.exports = FreechStream;

