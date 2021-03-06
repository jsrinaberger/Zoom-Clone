const socket = io('/') ;

const videoGrid = document.getElementById('video-grid');
const videoDisplay = document.createElement('video');
videoDisplay.muted = true;

const peer = new Peer(undefined, {
    //path: '/peerjs',
    host: '/',
    port: '3001'
});

var videoStream;
const peers = {};

// request video access
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(videoDisplay, stream);
    videoStream = stream;

    // send and receive video streams with other calls
    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');

        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });

        call.on('close', () => {
            video.remove();
            console.log("boof")
        });
    });

    socket.on('user-connected', (userID, connectedUserName) => {
        $('ul').append(`<hr class='chat_line'>`);
        $('ul').append(`<li class="message"><b>${connectedUserName} Has Connected</br></li>`);
        connectToNewUser(userID, stream);
    });

    socket.on('user-disconnect', (userID, connectedUserName) => {
        $('ul').append(`<hr class='chat_line'>`);
        $('ul').append(`<li class="message"><b>${connectedUserName} Has Disconnected</br></li>`);
        
        if (peers[userID]) {
            peers[userID].close();
        }
    })


    // get message input
    let message = $('input');

    // send message when enter is pressed
    $('html').keydown((e) => {
        if (e.which == 13 && message.val().length !== 0) {
            socket.emit('message', message.val(), userName);
            message.val('');
        }
    });

    // receive and display message
    socket.on('createMessage', (receivedMessage, connectedUserName) => {
        $('ul').append(`<hr class='chat_line'>`);
        $('ul').append(`<li class="message"><b>${connectedUserName}:</b><br/>${receivedMessage}</li>`);
        scrollMessages();
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

const toggleMute = () => {
    const enabled = videoStream.getAudioTracks()[0].enabled;

    if (enabled) {
        videoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        videoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
}

const setMuteButton = () => {
    const html = `<span>Mute</span>`;
    document.querySelector('.main_mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `<span>Unmute</span>`;
    document.querySelector('.main_mute_button').innerHTML = html;
}

const toggleVideo = () => {
    const enabled = videoStream.getVideoTracks()[0].enabled;

    if (enabled) {
        videoStream.getVideoTracks()[0].enabled = false;
        setStartVideo();
    } else {
        videoStream.getVideoTracks()[0].enabled = true;
        setStopVideo();
    }
}

const setStartVideo = () => {
    const html = `<span>Start Video</span>`;
    document.querySelector('.main_video_button').innerHTML = html;
}

const setStopVideo = () => {
    const html = `<span>Stop Video</span>`;
    document.querySelector('.main_video_button').innerHTML = html;
}

peer.on('open', id => {
    socket.emit('join-room', roomID, id, userName);
    console.log('host id ' + id);
});

// call a user who has just joined and display their video
const connectToNewUser = (userID, stream) => {
    const call = peer.call(userID, stream);
    const video = document.createElement('video');

    peers[userID] = call;

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });

    call.on('close', () => {
        video.remove();
    })
}

const scrollMessages = () => {
    var chatWindow = $('.main_chat_window');
    chatWindow.scrollTop(chatWindow.prop("scrollHeight"));
}

document.getElementById("leave").onclick = () => {
    location.href = "/";
}