var a = 10;
var sums = (data, callback) => {
console.log(data);
    callback(10,{'Success':'Value Pased'});
}

// Way to call callback function
sums(a, function (b,c) {
    var sum = a + b;
    console.log(sum);
    console.log(c.Success);
});

// second way
var route = {
    'sum': sums
};
var sumsss = 'sum';
var fun = route[sumsss];
console.log(fun);
fun(a, function (b,c) {
    var sum = a + b;
    console.log(sum,'Second Function Call');
    console.log(c.Success);
});

// Third Way to call Function

route[sumsss](a, function (b,c) {
    var sum = a + b;
    console.log(sum,'Third Function Call');
    console.log(c.Success);
});

// Last way is 
// Third Way to call Function

route['sum'](a, function (b,c) {
    var sum = a + b;
    console.log(sum,'last Function Call');
    console.log(c.Success);
});

// Json test

var jsonObj = {
    "firstName":"Rajnish",
    "lastName":"Singh",
    "phone":"12349638889",
    "password":"Thisismypassword",
    "tosAgreement":true
    }

    console.log(jsonObj);

    console.log(JSON.stringify(jsonObj));
    var fileData = require('./lib/data.js');
    fileData.delete('newFile','rajnishq',function(err) {
        console.log(err);
    } )