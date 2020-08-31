const socket = io('/') ;

const videoGrid = document.getElementById('video-grid');
const videoDisplay = document.createElement('video');
videoDisplay.muted = true;

const peer = new Peer(undefined, {
    //path: '/peerjs',
    host: '/',
    port: '3001'
});

// request video access
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(videoDisplay, stream);
    
    // send and receive video streams with other calls
    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');

        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', (userID) => {
        connectToNewUser(userID, stream);
    });
});

// start showing video on client's side
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}

peer.on('open', id => {
    socket.emit('join-room', roomID, id);
    console.log('host id ' + id);
});

// call a user who has just joined and display their video
const connectToNewUser = (userID, stream) => {
    const call = peer.call(userID, stream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
}


