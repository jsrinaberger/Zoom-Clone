const express = require('express');
const app = express();
const server = require('http').Server(app);

const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');

/*
const { ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});
*/

app.set('view engine', 'ejs');
app.use(express.static('public'));
//app.use('/peerjs', peerServer);

// redirect to user's new room with a unique room id
app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

// sending user to their unique room they created
app.get('/:room', (req, res) => {
    res.render('room', {roomId: req.params.room });
});


io.on('connection', socket => {
    socket.on('join-room', (roomID, userID) => {
        socket.join(roomID);
        socket.to(roomID).broadcast.emit('user-connected', userID);
        console.log('user connected');
        console.log('user id ' + userID)
    })
});

server.listen(3030);