var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var jf = require('jsonfile');
var fs =require('fs');
var port = process.env.PORT || 3000;

app.route('/')

    // show the form (GET http://localhost:8080/login)
    .get(function(req, res) {
        res.sendFile(__dirname + '/public/index.html');
    });

app.route('/client.js').get(function(req, res){ res.sendFile(__dirname + '/public/client.js'); });

http.listen(port, function(){
    console.log('Server is listening on *:3000');
});

io.on('connection', function(socket){
    console.log(socket.request.connection.remoteAddress);

    var loggedUser = { username: 'Anonyme'};
    var serviceMessage;

    /** Connexion d'un user
    * - sauvegarde d'un user
    * - broadcast d'un 'service-message'
    */
    socket.on('user-login', function(user){
        loggedUser = user;
        if(loggedUser !== undefined){
            serviceMessage = {
                text: 'User ' + loggedUser.username + ' logged in',
                type: 'login'
            };
        } else {
            serviceMessage = {
                text: 'User anonyme logged in',
                type: 'login'
            };
        }
        socket.broadcast.emit('service-message', serviceMessage);
    });

    /** Envoi d'un message
    * - Récupère la Date
    * - Associe le username
    * - emit d'un 'message'
    */
    socket.on('chat-message', function(message){
        //Heure du message
        var d = new Date();
        var n = d.getHours();
        var m = d.getMinutes() > 10 ? d.getMinutes(): '0'+d.getMinutes();
        var hour = n + ':' + m;
        message.hour = hour;

        //Nom de l'user
        message.username = loggedUser.username;
        io.emit('chat-message', message);
    });

    /** Deconnexion d'un user
    * - broadcast d'un 'service-message'
    */
    socket.on('disconnect', function(){
        if(loggedUser !== undefined){
            serviceMessage = {
                text: 'User ' + loggedUser.username + ' disconnected',
                type: 'logout'
            };
        } else {
            serviceMessage = {
                text: 'User anonyme disconnected',
                type: 'logout'
            };
        }
        socket.broadcast.emit('service-message',serviceMessage);
    });
});
