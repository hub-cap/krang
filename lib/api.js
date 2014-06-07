var dnode = require('dnode');
var express = require('express');
var OVZ_PORT = 6000;

function createExpressServer() {
  var app = express();
  app.listen(9000);

  var router = express.Router();

  router.get('/', function(req, res) {
    createContainer();
    console.log("called create container");
    res.send("Got it bub!");
  });


  app.use('/', router);
}

function createContainer() {

  dnode.connect(OVZ_PORT, function(remote){
    // Ask OVZ to create an instance
    remote.createContainer("test-name", function (result) {
      console.log(result);
    });
  });
}

createExpressServer();
