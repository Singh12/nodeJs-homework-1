/*
*These are the request handlers
*
*/
// Dependencies
var helpers = require('./helpers.js');
var _data = require('./data.js');
var config = require('./config.js');
// Define all the handlers
var handlers = {};
// Users Handlers
handlers.users = function (data, callback) {
    var acceptableMethod = ['get', 'post', 'delete', 'put'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}
handlers._users = {};

// Post method
// Data: Required
// firstName, lastName, phone, password, tosAgreement 
handlers._users.post = function (data, callback) {
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' ? true : false;
    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, function (err, data) {
            if (err) {
                var hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    var dataObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'password': hashedPassword,
                        'tosAgreement': tosAgreement
                    }
                    _data.create('users', phone, dataObject, function (err) {
                        console.log(!err);
                        if (!err) {
                            callback(200, { 'Success': 'USers profile has been created' });
                        } else {
                            callback(500, { 'Error': 'Can\'t write to a file somthing went wrong' });
                        }
                    })

                } else {
                    console.log(500, { 'Error': 'Password can not hashed' });
                }
            } else {
                callback(400, { 'Error': 'Can\'t store into a file users already exists or phone' })
            }
        });
    } else {
        callback(400, { 'Error': 'Required field missing' });
    }

}
// Get method
// Data: Required phone
// Delete password form the file and return to the users. 
handlers._users.get = function (data, callback) {
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length >= 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        console.log(token);
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            console.log(tokenIsValid);
            if (tokenIsValid) {
                _data.read('users', phone, function (err, data) {
                    if (!err) {
                        delete data.password;
                        callback(200, data);
                    } else {
                        callback(404, { 'Erorr': 'Somthing went wrong see the data read file in handlers js' })
                    }
                })
            } else {
                callback(403, { "Error": "Missing required token in header, or token is invalid." })
            }
        });

    } else {
        callback(404, { 'Error': 'Users not found' });
    }
}
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = function (data, callback) {
    // Check for required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
                if (tokenIsValid) {
                    // Lookup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // Update the fields if necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Could not update the user.' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'Specified user does not exist.' });
                        }
                    });
                } else {
                    callback(403, { "Error": "Missing required token in header, or token is invalid." })
                }
            });
        }
        else {
            callback(400, { 'Error': 'Missing fields to update.' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }

};
// Required data: phone
// Cleanup old checks associated with the user
handlers._users.delete = function(data,callback){
    // Check that phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
  
      // Get token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users',phone,function(err,userData){
            if(!err && userData){
              // Delete the user's data
              _data.delete('users',phone,function(err){
                if(!err){
                  // Delete each of the checks associated with the user
                  var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                  var checksToDelete = userChecks.length;
                  if(checksToDelete > 0){
                    var checksDeleted = 0;
                    var deletionErrors = false;
                    // Loop through the checks
                    userChecks.forEach(function(checkId){
                      // Delete the check
                      _data.delete('checks',checkId,function(err){
                        if(err){
                          deletionErrors = true;
                        }
                        checksDeleted++;
                        if(checksDeleted == checksToDelete){
                          if(!deletionErrors){
                            callback(200);
                          } else {
                            callback(500,{'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."})
                          }
                        }
                      });
                    });
                  } else {
                    callback(200);
                  }
                } else {
                  callback(500,{'Error' : 'Could not delete the specified user'});
                }
              });
            } else {
              callback(400,{'Error' : 'Could not find the specified user.'});
            }
          });
        } else {
          callback(403,{"Error" : "Missing required token in header, or token is invalid."});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field'})
    }
  };
// Users Tokens
handlers.tokens = function (data, callback) {
    var acceptableMethod = ['get', 'post', 'delete', 'put'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}
handlers._tokens = {};
// Getting post data
// Requeird password, phone, 
handlers._tokens.post = function (data, callback) {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    // Read file and match phone and password
    if (phone && password) {
        // if phone and password then match with the file
        _data.read('users', phone, function (err, data) {
            // match file data with the payload
            if (!err) {
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == data.password) {
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokens = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    }
                    _data.create('tokens', tokenId, tokens, function (err) {
                        if (!err) {
                            callback(200, tokens);
                        } else {
                            callback(500, { 'Erorr': 'Tokens can\'t be created' });
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Password not match' });
                }
            } else {
                callback(400, { 'Error': 'Phone no not exist in file' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
}
// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
    // Check that id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length >= 20 ? data.queryStringObject.id.trim() : false;
    console.log(data.queryStringObject.id);
    if (id) {
        // Lookup the token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field, or field invalid' })
    }
};
// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length >= 20 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    console.log(id);
    if (id && extend) {
        // Lookup the existing token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    _data.update('tokens', id, tokenData, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Could not update the token\'s expiration.' });
                        }
                    });
                } else {
                    callback(400, { "Error": "The token has already expired, and cannot be extended." });
                }
            } else {
                callback(400, { 'Error': 'Specified user does not exist.' });
            }
        });
    } else {
        callback(400, { "Error": "Missing required field(s) or field(s) are invalid." });
    }
};


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
    // Check that id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // Delete the token
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the specified token' });
                    }
                });
            } else {
                callback(400, { 'Error': 'Could not find the specified token.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
};
// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
    // Look up the tokens
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

//Checks 
// Users Handlers
handlers.checks = function (data, callback) {
    var acceptableMethod = ['get', 'post', 'delete', 'put'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
}
handlers._checks = {};
// Checks Post
// Required Data : protocols, url, method, successcode, timeout second
// Optional data: null
handlers._checks.post = function (data, callback) {
    // Validate all the inputs
    var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'dalete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successcode = typeof (data.payload.successcode) == 'object' && data.payload.successcode instanceof Array && data.payload.successcode.length > 0 ? data.payload.successcode : false;
    var timeoutSecond = typeof (data.payload.timeoutSecond) == 'number' && data.payload.timeoutSecond % 1 === 0 && data.payload.timeoutSecond >= 1 && data.payload.timeoutSecond <= 5 ? data.payload.timeoutSecond : false;
    if (protocol && url && method && successcode && timeoutSecond) {
        // Validate Token Data
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens', token, function (err, tockenData) {
            if (!err && tockenData) {
                var phone = tockenData.phone;
                if (tockenData.phone == phone && tockenData.expires > Date.now()) {
                // read data from users folder
                _data.read('users', phone, function (err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        if (userChecks.length < config.maxChecks) {
                            // Create the random Id for the checks
                            var checkId = helpers.createRandomString(20);
                            //Create the checks object and include the users phone
                            var checkObject = {
                                'id': checkId,
                                'protocol': protocol,
                                'userPhone': phone,
                                'url': url,
                                'method': method,
                                'successcode': successcode,
                                'timeoutSecond': timeoutSecond
                            };
                            _data.create('checks', checkId, checkObject, function (err) {
                                if (!err) {
                                    // Add the checks id to an users object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
                                    // Save the new user
                                    _data.update('users', phone, userData, function (err) {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(403, { 'Error': 'Phone no not exist' });
                                        }
                                    })
                                } else {
                                    callback(500, { 'Error': 'Can\'t store checks' });
                                }
                            })

                        } else {
                            callback(403, { 'Error': 'Excide the check limit (' + config.maxChecks + ')' })
                        }
                    } else {
                        callback(403, { 'Error': 'userData is missing check line number 361' })
                    }
                });
            } else {
               callback(403,{"Error":"Tocken Data Expire"}); 
            }
            } else {
                callback(403, { 'Error': 'Token Data is not valid' });
            }
        });
    } else {
        callback(403, { 'error': 'Missing Required fields see line number 403' });
    }
}
// Get Checks
// Required Id for the checks
// optional Nothing
handlers._checks.get = function (checkData, callback) {
    var id = typeof (checkData.queryStringObject.id) == 'string' && checkData.queryStringObject.id.trim().length >= 20 ? checkData.queryStringObject.id.trim() : false;
    if (id) {
        // Read checks data 
        _data.read('checks', id, function (err, data) {
            if (!err && data) {
                var token = typeof (checkData.headers.token) == 'string' ? checkData.headers.token : false;
                if (token) {
                    handlers._tokens.verifyToken(token, data.userPhone, function (tokenIsValid) {
                        console.log(data.userPhone);
                        console.log(tokenIsValid);
                        if (tokenIsValid) {
                            callback(200, data);
                        } else {
                            callback(403, { "Error": "token is invalid." });
                        }
                    });
                } else {
                    callback(403, { "Error": "Missing required token in header" });
                }
            } else {
                callback(403)
            }
        });
    } else {
        callback(404, { 'Error': 'Users not found' });
    }
}
// put Checks
// Required fields : Id
// Optional Fields: protocols, url, method, successcode, timeout second
handlers._checks.put = function (data, callback) {
    // Validate all the inputs
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length >= 20 ? data.payload.id.trim() : false;
    var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'dalete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successcode = typeof (data.payload.successcode) == 'object' && data.payload.successcode instanceof Array && data.payload.successcode.length > 0 ? data.payload.successcode : false;
    var timeoutSecond = typeof (data.payload.timeoutSecond) == 'number' && data.payload.timeoutSecond % 1 === 0 && data.payload.timeoutSecond >= 1 && data.payload.timeoutSecond <= 5 ? data.payload.timeoutSecond : false;
    if (id) {
        // Read data form the checks 
        _data.read('checks', id, function (err, checksData) {
            if (!err && checksData) {
                // validate tokens
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                if (token) {
                    handlers._tokens.verifyToken(token, checksData.userPhone, function (tokenIsValid) {
                        if (tokenIsValid) {
                            if (protocol) {
                                checksData.protocol = protocol;
                            }
                            if (url) {
                                checksData.url = url;
                            }
                            if (method) {
                                checksData.method = method;
                            }
                            if (successcode) {
                                checksData.successcode = successcode;
                            }
                            if (timeoutSecond) {
                                checksData.timeoutSecond = timeoutSecond;
                            }
                            _data.update('checks',id,checksData,function(err){
                                if(!err) {
                                    callback(200,checksData);
                                } else {
                                    callback(500, {"Error":"Checks not updated somthing went wrong"});
                                }
                            })
                        } else {
                            callback(403, { "Error": "Token in Invalid" });
                        }
                    });
                } else {
                    callback(403, { "Error": "Missing required token in header" });
                }
            } else {
                callback(404);
            }
        })
    } else {
        callback(404, { 'Error': 'Invaild Id' });
    }

}

// Delete Checks
// Required : Checks Id
// Delete users array checks data
handlers._checks.delete = function (data, callback) {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length >= 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('checks',id,function(err, checkData) {
            if(!err && checkData) {
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                if (token) { 
                    handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
                        if (tokenIsValid) { 
                            _data.read('users',checkData.userPhone,function(err,userData){
                                if(!err && userData) {
                                    var pos = userData.checks.indexOf(id);
                                    userData.checks.splice(pos,1);
                                    _data.update('users',checkData.userPhone,userData,function(err) {
                                        if(!err) {
                                            _data.delete('checks',id,function(err) {
                                                if(!err) {
                                                    callback(200)
                                                } else {
                                                    callback(500);
                                                }
                                            })
                                           
                                        } else {
                                            callback(500);
                                        }
                                    })
                                } else {
                                    callback(404);
                                }
                            });
                        } else {
                            callback(403, { "Error": "Token is Invalid" });
                        }
                    });
                } else {
                    callback(403, { "Error": "Missing required token in header" });
                }
            } else {
                callback(404, {"Error":"Checks not found"})
            }
        });
    } else {
        callback(404, {"Error":"Id is not passed in query string or id is invalid"});
    }
}

// Sample handler
handlers.ping = function (data, callback) {
    callback(200, { 'hello': 'data' });
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404, { 'Error': 'Handlers not found' });
};


module.exports = handlers;