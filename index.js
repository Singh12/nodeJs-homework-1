/*
* Creating Hello world Api
*
*/

// Importing HTTP
var http = require('http');
// Regestring URL service
var url = require('url');

// Creating server
var server = http.createServer(function(req,res){
 // Getting the url path   
 var urlParse = url.parse(req.url,true);
 var path = urlParse.pathname;
 // Removing all special character
 var clearPath = path.replace(/^\/+|\/+$/g, '');
 // Getting all headre information, but that is not required for the assignment
 var header = req.headers;
 // router function to find the path if not found just return empty object with 404 status
 var choosenHendler = typeof(route[clearPath]) !== 'undefined' ? route[clearPath] : handler.notfound;
 var data = {
     header: header,   
     path:clearPath
 }
  // Route the request to the handler specified in the router
choosenHendler(data, function(status,payload){
var status = typeof(status) == 'number' ? status:200;
var payload = typeof(payload) == 'object' ? payload:{};
// conver the payload to string
var payloadString = JSON.stringify(payload);
res.setHeader("Content-Type", "text/json");
// Return the response
res.writeHead(status);
res.end(payloadString);
console.log("Returning this response: ", status, payloadString);
});
 res.end('Returning Hello Api DATA in JSON formate');
});

// Listing to the port 3000

server.listen(3000, function(){
    console.log('The server is up and running');
});

// Createing Handlers object

var handler = {};

// hello handler
handler.hello = function(data,callback) {
callback(200,{'hello': 'Hello how are you this is my first Json api'});
};

// Not found Handler
handler.notfound = function(data,callback) {
callback(400);
};

// Router defination
var route = {
    'hello' : handler.hello
};