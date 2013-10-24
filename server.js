var 
  express = require('express'),
  mongoose = require('mongoose'),

  app = express(),
  appPort = 80,

  positionSchema,
  Position;

app.use(express.compress());
app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  positionSchema = mongoose.Schema({
    '_id': {type: String},
    'userId': {type: String},
    'videoId': {type: String},
    'currentPosition': {type: Number},
    'date': {type: Date, default: Date.now }
  });
  Position = mongoose.model('Positions', positionSchema);
  app.listen(appPort);
  console.log('teleport is listening on port: ' + appPort);
});

app.post('/:userId/:videoId/:currentPosition', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  var 
    userId = req.params.userId,
    videoId = req.params.videoId,
    currentPosition = parseInt(req.params.currentPosition);

  if (!userId || !videoId || !currentPosition) {
    res.json(412, {
      errorCode: 'MissingRequiredParam',
      errorMessage: 'You must provide a valid userId, videoId, and position in the request.'
    });  
    return;
  }

  Position.update(
    {userId: userId, videoId: videoId}, 
    {$set: {
      currentPosition: currentPosition, 
      date: new Date()}}, 
    {upsert: true}, 
    function (err) {
      if (err) {
        res.send('Error: ', err);
      }
      res.send('Success!');
  });
});

app.get('/:userId/:videoId', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  var 
    userId = req.params.userId,
    videoId = req.params.videoId;

  if (!userId || !videoId) {
    res.json(412, {
      errorCode: 'MissingRequiredParam',
      errorMessage: 'You must provide a valid userId and videoId in the request.'
    });  
    return;
  }
  Position.find({userId: userId, videoId: videoId}, function (err, results) {
    if (results && results[0] && results[0].currentPosition > 0 ) {
      res.send(results[0].currentPosition.toString());
    } else {
      res.send('0');
    }
  });
});

app.options('*', function (req,res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods:','GET,POST,DELETE,OPTIONS');
  res.send();
});

app.del('/:userId/:videoId', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  var 
    userId = req.params.userId,
    videoId = req.params.videoId;

  if (!userId || !videoId) {
    res.json(412, {
      errorCode: 'MissingRequiredParam',
      errorMessage: 'You must provide a valid userId, videoId, and position in the request.'
    });  
    return;
  }
  
  Position.remove(
    {userId: userId, videoId: videoId}, 
    function (err) {
      if (err) {
        res.send('Error: ', err);
      }
      res.send('Deleted!');
  });
});