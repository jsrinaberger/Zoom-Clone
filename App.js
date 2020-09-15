if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const server = require('http').Server(app);
const http = require('http');

const bodyParser = require('body-parser');

const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');

const initializePassport = require('./passport-config');
initializePassport(passport, email => 
     users.find(user => user.email === email),
     id => users.find(user => user.id === id)
);

const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');

var dbUrl = 'mongodb://localhost:27017/zoomClone';
const Mongo = require('mongodb').MongoClient;
const mongo = new Mongo(dbUrl);
const dbName = 'test';
const assert = require('assert');
const { MongoClient } = require('mongodb');


//const connectToDatabse = require('./utils/db');

/*
const { ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});
*/

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
//app.use('/peerjs', peerServer);


app.get('/', checkAuthentication, (req, res) => {
    res.render('index');
});

// check homepage form requests to determine where to redirect to
app.post('/', async (req, res) => {
    if (req.body.formID == 'create-room') {
        // redirect to user's new room with a unique room id
        res.redirect(`/${uuidv4()}`);
    } else if (req.body.formID == 'join-room') {
        res.redirect(`/${req.body.roomID}`);
    } else if (req.body.formID == 'login') {
        res.redirect('/login');
    } else {
        res.redirect('/');
    }

});

var users = [];

app.get('/login', checkNoAuthentication, (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
})

app.get('/register', checkNoAuthentication, (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: uuidv4(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        var account = {
            id: uuidv4(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        };

       MongoClient.connect(dbUrl, (err, db) => {
           if (err) throw err;
           var dbo = db.db("test");
           dbo.collection("user-data").insertOne(account, (err, res) => {
               if (err) throw error;
               console.log("Inserted");
           })

           dbo.collection("user-data").find({}).toArray((err, res) => {
            if (err) throw error;
            users = res;
            console.log(res);
        })
           db.close();
       })
        

        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
    console.log(users);
});

// sending user to their unique room they created
app.get('/:room', checkAuthentication, (req, res) => {
    res.render('room', {roomId: req.params.room });
});


io.on('connection', socket => {
    socket.on('join-room', (roomID, userID) => {
        socket.join(roomID);
        socket.to(roomID).broadcast.emit('user-connected', userID);

        socket.on('message', message => {
            io.to(roomID).emit('createMessage', message);
        });
    });
});

function checkAuthentication (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}

function checkNoAuthentication (req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    next();
}

const startServer = async () => {
    /*
    await connectToDatabse({
     useNewUrlParser: true, 
     useUnifiedTopology: true
    });*/
    getUsers();

    server.listen(3030);
}

const getUsers = async () => {
    try {
        MongoClient.connect(dbUrl, (err, db) => {
            if (err) throw err;
            var dbo = db.db("test");
            
            dbo.collection("user-data").find({}).toArray((err, res) => {
             if (err) throw error;
             console.log(res);
             for (i = 0; i < res.length; i++) {
                users.push({
                    id: res[i].id,
                    name: res[i].name,
                    email: res[i].email,
                    password: res[i].password,
                });
             }
         })
            db.close();
        })
    } catch (err) {
        console.log(err);
    }
    console.log(users);
}

startServer();
