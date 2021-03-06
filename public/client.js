var socket = io();

/* Entré du pseudo */
$('#login form').submit(function (e){
    e.preventDefault();
    var user = {
        username : $('#login input').val().trim()
    };
    if(user.username.length > 0){
        socket.emit('user-login', user);
        $('body').removeAttr('id');
        $('#chat input').focus();
    }
    $('#login form').fadeOut();
});

/* Envoi message */
$('form').on('submit', function(e){
    e.preventDefault();
    var message = { text: $('#m').val() };
    if (message.text.trim().length !== 0) { // Gestion message vide
        socket.emit('chat-message', message);
    }
    $('#m').val('');
    $('#chat input').focus(); // Focus sur le champ du message
});

//Affiche le message
socket.on('chat-message', function(message){
    $('#messages').append($('<li>').html('<div>'+ message.hour + '</div>De '+ message.username +' : '+  message.text));
});

//Connexion, deconnexion
socket.on('service-message', function(serviceMessage){
    $('#messages').append($('<div></div>').text(serviceMessage.text));
});
