/*
 * Primary file for API
 *
 */

// Dependencies
var http = require('http');
var url = require('url');
var https = require('https');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config.js');
var lib = require('./lib/data.js');
var handlers = require('./lib/handlers.js');
var helpers = require('./lib/helpers.js');
/*lib.delete('newFile','file',function(err){
  console.log(err);
})*/
// Configure the server to respond to all requests with a string
// todo delete after test
helpers.sendTwilioSms("7619174830","Hi",function(err){
  console.log("message sent with", err);
})
var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, function () {
  console.log('The server is up and running now on port: ' + config.httpPort + ' on: ' + config.envName + ' mode');
});
var httpsServerOptions = {
  cert: fs.readFileSync('./https/cert.pem'),
  key: fs.readFileSync('./https/key.pem')
}
// https server call
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, function () {
  console.log('The server is up and running now on port: ' + config.httpsPort + ' on: ' + config.envName + ' mode');
});

var unifiedServer = function (req, res) {

  // Parse the url
  var parsedUrl = url.parse(req.url, true);
  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Get the payload,if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();
    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
    // Construct the data object to send to the handler
    console.log(buffer);
    // buffer += JSON.stringify(buffer);
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.jsonObj(buffer)
    };
    // Route the request to the handler specified in the router
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code returned from the handler, or set the default status code to 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      // Use the payload returned from the handler, or set the default payload to an empty object
      payload = typeof (payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);
      res.setHeader("Content-Type", "text/json");
      // Return the response
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("Returning this response: ", statusCode, payloadString);

    });

  });
}

// Define the request router
var router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'checks': handlers.checks,
  'tokens': handlers.tokens
};