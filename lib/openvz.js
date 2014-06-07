var dnode = require('dnode');
var exec = require('child_process').exec;

var OVZ_PORT = 6000;
// This will be passed to the app
var IP = "10.0.0.";

// Prolly should move this to a utils
function getRandomNumber(min, max) {
  // ~~() negative-safe truncate magic
  return ~~(Math.random() * (max - min) + min);
}

// OpenVZ wrapper class
function OpenVZ() {
  this.used_ids = [];
  this.server = dnode({
    createContainer: function(name, cb) {

      VZ.create(cb);
    },
  })
  this.retrieveVZIDs();
}

// Starts the dnode server
OpenVZ.prototype.startServer = function() {
  console.log("used ids " + this.used_ids);
  console.log("started server");
  this.server.listen(OVZ_PORT);
}

// Init the OpenVZ Object
OpenVZ.prototype.init = function() {
  this.retrieveVZIDs();
}

// Gets the current used IDs
OpenVZ.prototype.retrieveVZIDs = function() {
  self = this;

  var cmd = "sudo vzlist --all -o ctid -H";
  exec(cmd,
       function(error, stdout, stderr) {
         ids = stdout.split("\n");
         ids = ids.map(function(val) {
           // There is an empty line in the vzlist
           if (val !== '') {
             // Add it to the list
             self.used_ids.push(val.trim());
           }
         });
         // Now that we have gotten the list,
         // we can start the server
         self.startServer();
       });
}

// Creates a random ID for the VZ instance
OpenVZ.prototype.generateID = function() {
  // boxing by IP currently cuz ip stuff is incorrect
  // and this is testable on the system
  vzid = getRandomNumber(10, 255);
  found_id = false;
  for (p in self.used_ids) {
    if (self.used_ids[p] == vzid) {
      // Found the id, break out and
      // try again.
      found_id = true;
      break;
    }
  }
  if (found_id) {
    console.log('crap made a dup! ' + vzid);
    return self.generateID();
  } else {
    self.used_ids.push(vzid);
    return vzid;
  }
}

// Starts a VZ by id
OpenVZ.prototype.start = function(vzid, cb) {
  var cmd = "sudo vzctl start " + vzid;
  return exec(cmd).on('close', function (code) {
    if (code !== 0) {
      console.log("Error " + code);
    } else {
      cb("Finished creating and starting VZ " + vzid);
    }});
}

// Sets a VZ ip by id
OpenVZ.prototype.setIP = function(vzid, ip, cb) {
  self = this;
  var ipaddline = "sudo vzctl set "
    + vzid + " --ipadd " + ip + " --save";
  exec(ipaddline).on('close', function(code) {
    if (code !== 0) {
      console.log("Error " + code);
    } else {
      self.start(vzid, cb);
    }});
}

// Creates a VZ
OpenVZ.prototype.create = function(cb) {
  self = this;
  var vzid = this.generateID();

  var execline = "sudo vzctl create "
    + vzid + " --ostemplate debian-7.0-x86_64";
  exec(execline).on('close', function(code) {
    var ip = IP + vzid;
    if (code !== 0) {
      console.log("Error " + code);
    } else {
      self.setIP(vzid, ip, cb);
    }});
}

VZ = new OpenVZ();
