var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/');
console.log(lib.baseDir);
// Write data to a file

lib.create = function (dir, file, data, callback) {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
            // Write to the file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    })
                } else {
                    console.log('Can\'t Write file');
                }
            })
        } else {
            console.log('error in openning file');
        }
    });
}

lib.read = function (dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {
        if (!err) {
            jsonData = helpers.jsonObj(data);
            callback(false, jsonData);
        } else {
            callback(err, data);
        }
    });
}

// Update data in a file
lib.update = function (dir, file, data, callback) {

    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            var stringData = JSON.stringify(data);

            // Truncate the file
            fs.truncate(fileDescriptor, function (err) {
                if (!err) {
                    // Write to file and close it
                    fs.writeFile(fileDescriptor, stringData, function (err) {
                        if (!err) {
                            fs.close(fileDescriptor, function (err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open file for updating, it may not exist yet');
        }
    });

};
lib.delete = function (dir, file, callback) {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
        if (!err) {
            callback(false)
        }
        else {
            callback('File can\'t deleted');
        }
    });
}
module.exports = lib;