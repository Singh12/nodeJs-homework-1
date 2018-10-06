/*
* These are the helper class
*
*/

// Dependencies
var crypto = require('crypto');
var querystring = require('querystring');
var https = require('https');
var querystring = require('querystring');
var config = require('./config.js');

// Create function for hashed password

var helpers = {};
helpers.hash = function (password) {
    var hashedPassword = crypto.createHash('md5', config.hashingSecret).update(password).digest("hex");
    return hashedPassword;
}

// Convert to json object and return object value
helpers.jsonObj = (buffer) => {
    try {
        var obj = JSON.parse(buffer);
        return obj;
    }
    catch (e) {
        return {};
    }
}
helpers.createRandomString = function (num) {
    var tockenCount = typeof (num) ==
        'number' && num > 0 ? num : false;
    if (tockenCount) {
        // Define all the possible characters that could go into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        // Start the final string
        var str = '';
        for (var i = 0; i <= tockenCount; i++) {
            var randomCaracter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCaracter; 
    }
    // Return random string
    return str;
    } else {
        return false;
    }

}

helpers.sendTwilioSms = function(phone,msg,callback){
    // Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(phone && msg){
  
      // Configure the request payload
      var payload = {
        'From' : config.twilio.fromPhone,
        'To' : '+91'+phone,
        'Body' : msg
      };
      var stringPayload = querystring.stringify(payload);
  
  
      // Configure the request details
      var requestDetails = {
        'protocol' : 'https:',
        'hostname' : 'api.twilio.com',
        'method' : 'POST',
        'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
        'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
        'headers' : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringPayload)
        }
      };
  
      // Instantiate the request object
      var req = https.request(requestDetails,function(res){
          // Grab the status of the sent request
          var status =  res.statusCode;
          // Callback successfully if the request went through
          if(status == 200 || status == 201){
            callback(false);
          } else {
            callback('Status code returned was '+status);
          }
      });
  
      // Bind to the error event so it doesn't get thrown
      req.on('error',function(e){
        callback(e);
      });
  
      // Add the payload
      req.write(stringPayload);
  
      // End the request
      req.end();
  
    } else {
      callback('Given parameters were missing or invalid');
    }
  };
  

module.exports = helpers;