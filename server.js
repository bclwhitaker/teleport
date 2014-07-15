var
  express = require('express'),
  mongoose = require('mongoose'),
  crypto = require('crypto'),

  app = express(),
  appPort = 2005,

  positionSchema,
  Playlist,
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

  playlistResumeSchema = mongoose.Schema({
    '_id': {type: String},
    'playlistHash': {type: String},
    'currentVideo': {type: String},
    'date': {type: Date, default: Date.now}
  });

  Position = mongoose.model('Positions', positionSchema);

  // The collection that tracks where the user is in a specific playlist.
  Playlist = mongoose.model('Playlists', playlistResumeSchema);

  app.listen(appPort);
  console.log('teleport is listening on port: ' + appPort);
});

/**
* Handles updating the Mongo collection which tracks the position users are at in specific
* videos. The position is tracked in seconds.
*/
app.post('/userId/:userId/videoId/:videoId/position/:position', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  var 
    userId = req.params.userId,
    videoId = req.params.videoId,
    currentPosition = parseInt(req.params.position);

  if (!userId ||!videoId || !currentPosition) {
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

/**
* Used to update the tracker that follows where a user is in a specific
* playlist. The tracking is done by looking up the hash of the userId and playlistId
* and finding the corresponding videoId which is where the user left off.
*/
app.post('/userId/:userId/playlistId/:playlistId/videoId/:videoId', function (req, res) {
  var
    userId = req.params.userId,
    videoId = req.params.videoId,
    playlistId = req.params.playlistId,
    playlistHash;

  res.set('Access-Control-Allow-Origin', '*');

  if (!userId || !playlistId || !videoId) {
    res.json(412, {
      errorCode: 'MissingRequiredParam',
      errorMessage: 'You must provide a valid userId, videoId and playlistId in the request.'
    });
    return;
  }

  // Generate the hash of the userId + playlistId.
  playlistHash = crypto.createHash('md5').update(userId + playlistId).digest('hex');

  // Update the collection with the new video Id.
  Playlist.update(
    {playlistHash: playlistHash, currentVideo: videoId},
    {
      $set: {
        playlistHash: playlistHash,
        currentVideo: videoId
      }
    },
    {upsert: true},
    function (err) {
      if (err) {
        res.send('Error: ', err);
      }
      res.send('Success!');
    }
  );
});

/**
* Responds with where the user should be in the specified video. If there is no entry
* in the database for this user/video 0 is returned.
*
* Positions returned are in seconds.
*/
app.get('/userId/:userId/videoId/:videoId', function (req, res) {
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

/**
* Responds with a video ID corresponding to where in the provided playlist the
* specified user should be.
*/
app.get('/userId/:userId/playlistId/:playlistId', function(req, res) {
  res.set('Access-Control-Allow-Origin', '*');

  var
    userId = req.params.userId,
    playlistId = req.params.playlistId,
    playlistHash;

  if (!userId || !playlistId) {
    res.json(412, {
      errorCode: 'MissingRequiredParam',
      errorMessage: 'You must provide a valid userId and playlistId in the request.'
    });
    return;
  }

  // Generate the hash of the userId + playlistId.
  playlistHash = crypto.createHash('md5').update(userId + playlistId).digest('hex');

  Playlist.find({playlistHash: playlistHash}, function(err, results) {
    if (results && results[0] && results[0].currentVideo) {
      res.send(results[0].currentVideo.toString());
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

/**
* Removes the time entry for the specified user ID and video ID combo.
*/
app.del('/userId/:userId/videoId/:videoId', function (req, res) {
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

/**
* Removes the entry in the playlist progress tracking collection
* for the specified user ID and playlist ID combo.
*/
app.del('/userId/:userId/playlistId/:playlistId', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  var
    userId = req.params.userId,
    playlistId = req.params.playlistId;
  // Generate the hash of the userId + playlistId.
  playlistHash = crypto.createHash('md5').update(userId + playlistId).digest('hex');

  if (!userId || !playlistId) {
    res.json(412, {
      errorCode: 'MissingRequiredParam',
      errorMessage: 'You must provide a valid userId and playlistId in the request.'
    });
    return;
  }

  Playlist.remove(
    {playlistHash: playlistHash},
    function (err) {
      if (err) {
        res.send('Error: ', err);
      }
      res.send('Deleted!');
  });
});
