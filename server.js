/* jshint asi: true */
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var jf = require('jsonfile')
// var fs =require('fs')
var port = process.env.PORT || 3000

app.route('/')

    // show the form (GET http://localhost:8080/login)
    .get(function(req, res) {
        res.sendFile(__dirname + '/public/index.html')
    })

app.route('/client.js').get(function(req, res){ res.sendFile(__dirname + '/public/client.js') })

http.listen(port, function(){
    console.log('Server is listening on *:3000')
})


io.on('connection', function(socket){
    console.log(socket.request.connection.remoteAddress)


    var loggedUser = { username: 'Anonyme'}
    var serviceMessage

    /** Connexion d'un user
    * - sauvegarde d'un user
    * - broadcast d'un 'service-message'
    */
    socket.on('user-login', function(user){
        loggedUser = user
        if(loggedUser !== undefined){
            serviceMessage = {
                text: 'Utilisateur ' + loggedUser.username + ' connecté',
                type: 'login'
            }
        } else {
            serviceMessage = {
                text: 'Utilisateur anonyme connecté',
                type: 'login'
            }
        }
        socket.broadcast.emit('service-message', serviceMessage)
    })

    /** Envoi d'un message
    * - Récupère la Date
    * - Associe le username
    * - emit d'un 'message'
    */
    socket.on('chat-message', function(message){
        //Heure du message
        var d = new Date()
        var n = d.getHours()
        var m = d.getMinutes() > 10 ? d.getMinutes(): '0'+d.getMinutes()
        var hour = n + ':' + m
        message.hour = hour

        //Nom de l'user
        message.username = loggedUser.username
        io.emit('chat-message', message)

        /** Modification d'un fichier json, ajout du message
        * Modifie un fichier Json associer à la conversation
        */
        var file = __dirname+'/storage/chat/data.json'
        jf.readFile(file, 'utf8', function(err, json){
            if (err){
                console.log(err)
            } else {
                json = JSON.parse(json)
                json.message.push({user: message.username, date: message.hour, message: message.text})
                json = JSON.stringify(json)
                jf.writeFile(file, json, 'utf8');
                console.log(json)
            }
        })
    })

    /** Deconnexion d'un user
    * - broadcast d'un 'service-message'
    */
    socket.on('disconnect', function(){
        if(loggedUser !== undefined){
            serviceMessage = {
                text: 'User ' + loggedUser.username + ' disconnected',
                type: 'logout'
            }
        } else {
            serviceMessage = {
                text: 'User anonyme disconnected',
                type: 'logout'
            }
        }
        socket.broadcast.emit('service-message',serviceMessage)
    })
})
