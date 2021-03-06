var express = require('express');
var https = require('https');
var mongoClient = require('mongodb').MongoClient;
var server = express();
var googleApiKey = 'My_API Key';
var cx = 'My_search_engine_context';
var dbUrl = 'My_DB_URL';

function add_search(searchTerm) {
  mongoClient.connect(dbUrl, function(err, db) {
    if(err) throw err;
    db.collection('recent_searches').find({}).toArray(function(error, docs) {
      if(error) throw error;
      var data = docs;
      data.unshift({term: searchTerm, time: new Date()});
      data.splice(10);
      db.collection('recent_searches').deleteMany({});
      db.collection('recent_searches').insertMany(data, function(e, r) {
        db.close();
      });
    });
  });
  
}

server.listen(process.env.PORT, process.env.IP);
server.use('/', express.static('view'));

server.get('/recent', function(req,res) {
  mongoClient.connect(dbUrl, function(err, db) {
    if(err) throw err;
    db.collection('recent_searches').find({}, {'term': 1, 'time': 1, '_id': 0}).toArray(function (error, docs) {
      if(error) throw error;
      res.send(docs);
      db.close();
    });
  });
 
});
//ignore favicon.ico requests
server.get('/favicon.ico', function(req, res) {
    res.sendStatus(200);
});
server.get('/:searchQuery', function(req, res) {
  var query = req.params.searchQuery;
  var offset = req.query.offset || 1;
  var googleApiUrl = 'https://www.googleapis.com/customsearch/v1?key=' +  googleApiKey + '&cx=' + cx + '&searchType=image&num=5&start=' + offset  + '&q=' + query;
  var obj = '';
  add_search(query);
  https.get(googleApiUrl, function(request) {
    request.on('data', function(data) {
      obj += data;
    });
    request.on('end', function() {
      obj = JSON.parse(obj);
      res.send(obj.items);
    });
  });
});

