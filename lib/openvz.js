var dnode = require('dnode');
var exec = require('child_process').exec;

var OVZ_PORT = 6000;
// hacky for testing, gotta figure out how to up these
var CURR_ID = 4;
var IP = "10.0.0.";

function start(vzid, cb) {
    var cmd = "sudo vzctl start " + vzid;
    return exec(cmd).on('close', function (code) {
        if (code !== 0) {
            console.log("Error " + code);
        } else {
            cb("Finished creating and starting VZ " + vzid);
        }});
}

function setIP(vzid, ip, cb) {
    var ipaddline = "sudo vzctl set "
        + vzid + " --ipadd " + ip + " --save";
    exec(ipaddline).on('close', function(code) {
        if (code !== 0) {
            console.log("Error " + code);
        } else {
            start(vzid, cb);
        }});
}

function create(vzid, ip, cb) {
    var execline = "sudo vzctl create "
        + vzid + " --ostemplate debian-7.0-x86_64";
    exec(execline).on('close', function(code) {
        if (code !== 0) {
            console.log("Error " + code);
        } else {
            setIP(vzid, ip, cb);
        }});
}

var server = dnode({
    createContainer: function(name, cb) {
        vzid = CURR_ID;
        ip = IP + CURR_ID;
         create(vzid, ip, cb);
    },
})

server.listen(OVZ_PORT);
