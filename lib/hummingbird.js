var sys = require('sys'),
  fs = require('fs'),
  config = require('../config/config'),
  View = require('./view').View,
  Metric = require('./metric').Metric,
  Aggregates = require('./aggregates').Aggregates,
  Buffer = require('buffer').Buffer,
  arrays = require('./arrays'),
  querystring = require('querystring');
 


var Hummingbird = function(db, callback) {
  var pixelData = fs.readFileSync(__dirname + "/../images/tracking.gif", 'binary');
  this.pixel = new Buffer(43);
  this.pixel.write(pixelData, 'binary', 0);

  this.metrics = [];
};

Hummingbird.prototype = {
  init: function(db, callback) {
    this.setupDb(db, function() {
      callback();
    });
  },

  setupDb: function(db, callback) {
    var self = this;
    db.createCollection('visits', function(err, collection) {
      db.collection('visits', function(err, collection) {
        self.collection = collection;
        callback();
      });
    });
  },

  addAllMetrics: function(io, db) {
    var self = this;

    Metric.allMetrics(function(metric) {
      metric.init(db);
      metric.io = io;
      self.metrics.push(metric);
    });
  },

  serveRequest: function(req, res) {
    this.writePixel(res);

    var env = this.splitQuery(req.url.split('?')[1]);
   console.log("logidogi");
   // USER AGENT
   // env.user_agent = req.headers['user-agent']
   // env.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  /*  env.url2 = window.location; */
   // env.url = req.headers['referer'];
    this.clientInfo(req, env);

   // console.log(env.url);
    this.insertData(env);
  },

  insertData: function(env) {
    env.timestamp = new Date();
    var view = new View(env);

   // env.url_key = view.urlKey;
   // env.product_id = view.productId;

    this.collection.insertAll([env]);

    for(var i = 0; i < this.metrics.length; i++) {
      this.metrics[i].incrementCallback(view);
      this.metrics[i].isDirty = true;
    }
  },

  splitQuery: function(query) {
    var queryString = {};
    (query || "").replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) { queryString[$1] = querystring.unescape($3.replace(/\+/g, ' ')); }
    );

    return queryString;
  },

  writePixel: function(res) {
    res.writeHead(200, { 'Content-Type': 'image/gif',
                         'Content-Disposition': 'inline',
                         'Content-Length': '43' });
    res.end(this.pixel);
  },

  handleError: function(req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.end();

    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  },

  clientInfo: function(req, env){
  

  try { 

  env.url = req.headers['referer'];
  env.user_agent = req.headers['user-agent'];
  env.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  

//  jsdom.env(env.url, [  'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js' ],
//  function(errors, window) {
//    var position = window.$("img#adooza-picky").position();
//    var height = window.innerWidth;
   //
//    console.log(window.$("div#adooza-picky").text());
//    console.log(window.$("div#adooza-picky").position());
//  });




  }
  catch(e) {
  console.log(e);
  }
  
  return env

  }
};

exports.Hummingbird = Hummingbird;
