var 
  express = require('express'),
  mongoose = require('mongoose'),

  app = express(),
  appPort = 8081,

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
    'videoId': {type: Number},
    'currentPosition': {type: Number},
    'date': {type: Date, default: Date.now }
  });
  Position = mongoose.model('Positions', positionSchema);
  app.listen(appPort);
  console.log('teleport is listening on port: ' + appPort);
});

app.get('/set/:userId/:videoId/:currentPosition', function (req, res) {
  res.set('Access-Control-Allow-Origin','http://ec2-107-20-72-18.compute-1.amazonaws.com');  
  var 
    userId = req.params.userId,
    videoId = parseInt(req.params.videoId),
    currentPosition = parseInt(req.params.currentPosition),

    position;

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
    function (err, position) {
      if (err) {
        res.send('Error: ', err);
      }
      res.send('Success!');
  });
});

app.get('/get/:userId/:videoId', function (req, res) {
  res.set('Access-Control-Allow-Origin','http://ec2-107-20-72-18.compute-1.amazonaws.com');
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
    res.send(results[0].currentPosition.toString());
  });
});