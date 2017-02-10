/* jshint asi: true */
/* jshint esversion: 6 */
var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)
var jf = require('jsonfile')
var fs =require('fs')
var port = process.env.PORT || 3000


// room par défaut
// var roomname = "default"
// var used_rooms = []
// les utilisateurs qui sont déjà connectés
room_id = 34

var usernames = {}

/* ~~~~ ROUTING ~~~~ */
//Indique le fichier de base du chat
app.route('/').get(function(req, res) { res.sendFile(__dirname + '/public/index.html') })

// Idée : créer une route par user
//app.route('/user*').get(function(req, res) { res.sendFile(__dirname + '/public/index.html') })
//
//
//Indique l'emplacement de client.js
app.route('/client.js').get(function(req, res){ res.sendFile(__dirname +'/public/client.js') })

// //Indique l'emplacement de
// app.route('/admin').get(function(req, res) { res.sendFile(__dirname + '/public/admin.html') })
// //Indique l'emplacement de admin.js
// app.route('/client.js').get(function(req, res){ res.sendFile(__dirname + '/public/admin.js') })


/* ~~~~ SOCKET.IO ~~~~ */
io.on('connection', function(socket){

    var user = {id: socket.id} // (A REMPLACER PAR l'IP ou associer à une adrresse email) !!!!!
    var file2Write = __dirname + '/storage/chat/' + socket.id + '.json'
    var loggedUser = { username: 'Anonyme'}
    var serviceMessage
    var roomname = "room"+user.id;

    /** Connexion d'un user
     * - crée un fichier json avec l'id de l'utilisateur
     */
    var basicJsonf = '{ "message": [] }'
    fs.writeFile(__dirname + '/storage/chat/' + socket.id + '.json', basicJsonf, (err) => {
        if (err) throw err
        console.log('It\'s saved!')
    })

    /** User inscrit son pseudo
    * - sauvegarde d'un user
    * - envoi du user sur un chanel
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

        // usernames[loggedUser.username] = loggedUser.username
        socket.join(roomname)
        socket.to(roomname).emit('service-message', serviceMessage)
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
        message.username = loggedUser.username


        /** Ecrit le message dans le fichier json */
        var file = file2Write
        jf.readFile(file, 'utf8', function(err, json){
            if (err){
                console.log(err)
            } else {
                typeof(json) === 'object' ? null : json = JSON.parse(json)
                json.message.push({user: message.username, date: message.hour, message: message.text})
                json = JSON.stringify(json)
                jf.writeFile(file, json, 'utf8')
                console.log(json)
            }
        })

        io.to("room"+socket.id).emit('chat-message', message)
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
        io.to("room"+socket.id).emit('service-message',serviceMessage)
    })
})

http.listen(port, function(){
    console.log('Server is listening on *:3000')
})
