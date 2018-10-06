/*
* Creating config file for node application
*
*/
  
// Creating environment object

var environment = {};

environment.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'this is my scripte pages',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'AC99e03aa9ddb0a6630455ae312ed88242',
        'authToken' : 'be386e3b2d6d72b81db1e6cb395bacb1',
        'fromPhone' : '+16039451156'
      }
};
environment.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'this is my scripte pages',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
      }
};

var currentEnvironment  = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var environmentToExport = typeof(environment[currentEnvironment]) == 'object' ? environment[currentEnvironment] : environment.staging;
module.exports = environmentToExport;
