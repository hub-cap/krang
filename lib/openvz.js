var dnode = require('dnode');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var through = require('through');
var concat = require('concat-stream');

var OVZ_PORT = 6000;
// This will be passed to the app
var IP = "10.0.0.";

// Prolly should move this to a utils
function getRandomNumber(min, max) {
  // ~~() negative-safe truncate magic
  return ~~(Math.random() * (max - min) + min);
}

function sudoSpawnString(cmdline) {
  return spawn('sudo', cmdline.split(' '))
}

// OpenVZ wrapper class
function OpenVZ() {
  this.used_ids = [];

  this.server = dnode({
    createContainer: this.create.bind(this)
  })

  this.init();
}

// Starts the dnode server
OpenVZ.prototype.startServer = function() {
  console.log("started server");
  this.server.listen(OVZ_PORT);
}

// Grabs a list of VZ's that are useable
OpenVZ.prototype.init = function() {
  var cmd = "vzlist --all -o ctid -H";
  vzlist = sudoSpawnString(cmd);
  vzlist.stdout.pipe(concat(this.getIDList.bind(this)));
}

// Gets the current used IDs
OpenVZ.prototype.getIDList = function(data) {
  ids = data.toString().split("\n");
  ids.map(function(val) {
    // There is an empty line in the vzlist
    if (val !== '') {
      // Add it to the list
        this.used_ids.push(val.trim());
    }
  }, this);
  // Now that we have gotten the list,
  // we can start the server
  this.startServer();
}

// Creates a random ID for the VZ instance
OpenVZ.prototype.generateID = function() {
  // boxing by IP currently cuz ip stuff is incorrect
  // and this is testable on the system
  vzid = getRandomNumber(10, 255);
  found_id = false;
  for (p in this.used_ids) {
    if (this.used_ids[p] == vzid) {
      // Found the id, break out and
      // try again.
      found_id = true;
      break;
    }
  }
  if (found_id) {
    // generate a new one
    return this.generateID();
  } else {
    this.used_ids.push(vzid);
    return vzid;
  }
}

// Starts a VZ by id
OpenVZ.prototype.start = function(vzid, cb) {
  var cmd = "vzctl start " + vzid;
  var run = sudoSpawnString(cmd);
  var write = function(data) {
    // we should check for failures here
  }
  var end = function() { cb("Started VZ " + vzid) };

  run.stdout.pipe(through(write, end));
}

// Sets a VZ ip by id
OpenVZ.prototype.setIP = function(vzid, ip, cb) {
  var cmd = "sudo vzctl set "
    + vzid + " --ipadd " + ip + " --save";
  var run = sudoSpawnString(cmd);

  var write = function(data) {};
  var end = function() {
    this.start(vzid, cb);
  };

  run.stdout.pipe(through(write, end.bind(this)));
}

// Creates a VZ
OpenVZ.prototype.create = function(name, cb) {
  var vzid = this.generateID();
  var cmd = "sudo vzctl create "
    + vzid + " --ostemplate debian-7.0-x86_64";
  var run = sudoSpawnString(cmd);

  var write = function(data) {};
  var end = function() {
    var ip = IP + vzid;
    this.setIP(vzid, ip, cb);
  };

  console.log('spinning up a new VZ ' + vzid);

  run.stdout.pipe(through(write, end.bind(this)));
}

VZ = new OpenVZ();
