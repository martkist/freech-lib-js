# freech-lib-js
A [Freech](http://github.com/martkist/freech-core) Library in JavaScript

## Scope of this Project

freech-lib-js handles all querying and manipulation of the Freech P2P network, given the availability of a (remote or local) freechd JSON-RPC endpoint. This includes managing the network resource, by bundleing queries and by caching. This also includes the ability sign posts and to encrypt and decrypt direct messages locally.

freech-lib-js should be compilable for as many platforms as possible including:
- All popular Browsers (for web apps as well as firefoxOS)
- node-js (for server-side functionality)
- The iOS Javascript VM (for building native iOS apps)
- The Android Javascript VM (for building native android apps)

A techdemo of freech-lib-js combined with react-js can be found at http://github.com/martkist/freech-react

## Implementation Status

 Resource | query | manipulate (client side wallet) | manipulate (server side wallet) 
------|-----|-----|------|
 Posts     	| ✓     |                          ✓  |	✓						
 Replies     	| ✓     |                      ✓      |	✓						
 Retwists     	| ✓     |                      ✓      |	✓						
 Profile     	| ✓     |                      ✓      |	✓						
 Avatar     	| ✓     |                      ✓      |	✓						
 Followings   	| ✓     |                      ✓      |	✓						
 Mentions     	| ✓     |                      ✓      |	-						
 Hashtags     	| ✓     |                      ✓      |	-						
 Promoted Posts|  ✓    |  -                         |	-						
 Direct Messages| -    |           -                 |	✓					
 Group Messages| -    |           -                 |	-						

## Todo

### Next Version

* Implement methods to create or import accounts.
* Implement group chats

### At Some Point

* Implement bind-methods (e.g. bindProfile(...) ) that repeatedly queries the resource and invokes a callback function for every update.
* When posting a new resource revision (status, profile, avatar...) add the updated resource to the cache but flag it as "dirty" and rollback if the resource is not confirmed after a certain time.
* Implement get...Promise(...) functions (e.g. getProfilePromise(...) ) that work with https://github.com/yortus/asyncawait to avoid callback hells
* Implement code specific error functions (e.g. "errorfunc_32052" catches errors with code 32052)

## Usage

#### In a Node Project

From inside the project folder run
```
npm install freech-lib-js
```
Then inside your code import the library using
```
Freech = require('freech-lib-js');
```

#### In a Webapp

Download the `freech-lib.js` file into you project folder. Link to it inside html using
```
<script src="path/to/freech-lib.js"></script>
```

## Code Examples

Display the content of the latest post of user martkistdevs:

```
Freech.getUser("martkistdevs").doStatus(function(post){
  console.log(post.getContent());  
});
```

For more code examples in tutorial form, see [/examples](https://github.com/martkist/freech-lib-js/tree/master/examples)

## Error Codes

freech-lib-js passes through all JSON-RPC errors. Internal errors are thrown in the same format with codes ranging between 32050 and 32099:

* 32050: DHT resource signature could not be verified.
* 32051: Unknown query setting was requested.
* 32052: DHT resource is empty. (Only thrown for status, post, profile and avatar resources.)
* 32060: Post signature could not be verified.
* 32061: Public key not available on server.
* 32062: Signature of retwisted post could not be verified.
* 32063: Post could not be decrypted.
* 32064: Private key is in conflict with public key.
* 32080: Unsupported wallet type.
* 32081: No wallet users found on the server.
* 32082: Torrent inactive. Activate torrent first!
* 32090: Host not reachable.
* 32091: Request was not processed successfully (http error: HTTP_ERROR_CODE).
* 32092: An error occurred while parsing the JSON response body.

## Change Log

## 0.3.0

* New query setting `queryId`. Can be used to mark multiple queries with a common id. With the `Freech.onQueryComplete(...)` function a handler can be registered that is triggered when the last query is completed. see examples/021_deep_fetching.js

### 0.2.1

* Better handling of http/connection errors. Error codes: 32090-32092

## 0.2.0

* Resources can now remove themselves from the cache using their own trim() function.
* New function Freech.trimCache(timestamp) deletes every resource from the cache that is older than the timestamp, or has not been accessed since the timestamp. Needed to manage localStorage size in browsers.
* Resources with invalid signatures now get removed from the cache.
