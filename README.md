teleport
========
To update a time:
curl -XPOST http://{$ADDRESS}/userId/:userId/videoId/:videoId/position/:currentPosition

To update where in a playlist the user is:
curl -XPOST http://{$ADDRESS}/userId/:userId/playlistId/:playlistId/videoId/:videoId

To get a time:
curl -XGET http://{$ADDRESS}/userId/:userId/videoId/:videoId

To get where a user is in the playlist:
curl -XGET http://{$ADDRESS}/userId/:userId/playlistId/:playlistId

To delete a time entry:
curl -XDELETE http://{$ADDRESS}/userId/:userId/videoId/:videoId