var express = require('express');    //Express Web Server 
var path = require('path');     //used for file path

var app = express();
app.use(express.static(path.join(__dirname, './')));

var server = app.listen(8592, function() {
    console.log('Listening on port %d', server.address().port);
});
