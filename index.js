const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 3000;
const app = express();
const server = require('http').createServer(app)
const io = require("socket.io")(server, {
    cors: {
        origin: "https://roomber.herokuapp.com",
        methods: ["GET", "POST"]
    }
})
var sharedsession = require("express-socket.io-session");
var session = require("express-session")({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
});
const mongoose = require('mongoose');

const UsuarioSchema = mongoose.Schema({
    email: {
        type: String
    },
    name: {
        type: String,
        require: true
    },
    password: {
        type: String
    }
})

const RoomSchema = mongoose.Schema({
    usuario_id: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' }
    ]
})

const StageSchema = mongoose.Schema({
    xplayer: {
        type: Number,
        require: true
    },
    yplayer: {
        type: Number,
        require: true
    },
    usuario_id: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', require: true }
    ],
    room: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'room', require: true }
    ]
})

const ChatSchema = mongoose.Schema({
    message: {
        type: String,
        require: true
    },
    author: {
        type: String,
        require: true
    },
    room: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'rooms', require: true }
    ]
})

const User = mongoose.model('usuarios', UsuarioSchema)
const Room = mongoose.model('room', RoomSchema)
const Stage = mongoose.model('stage', StageSchema)
const Chat = mongoose.model('chat', ChatSchema)
    /*
    const room = new Room();
    room.save().then(savedDoc => {
        console.log("Room salvo com sucesso!")
    })*/

app.use(express.static(path.resolve('./public')));
app.disable('view cache');
app.use(session)
io.use(sharedsession(session, {
    autoSave: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", function(req, res) {
    res.sendFile(__dirname + '/public/home.html');
})

app.get('*', function(req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

io.of('/').use(sharedsession(session, {
    autoSave: true
}));

mongoose.connect('mongodb+srv://dbUser:Wh5kFACYwnKv8iFa@cluster0.gnhhf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority&ssl=true', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(() => {
    console.log("MongoDB Conectado");

    io.on('connection', socket => {
        var array = [];
        var players = [];
        console.log("socket conectado!");

        socket.on('sendMessage', data => {
            const chat = new Chat({
                message: data.message,
                author: socket.handshake.session.name,
                room: '609c0073ef02480d2cd5e542'
            })
            chat.save().then(savedDoc => {
                socket.broadcast.emit('receivedMessage', data);
            })
        })

        if (socket.handshake.session.usuario_id) {
            User.findOne({ _id: socket.handshake.session.usuario_id }, function(err, usuario) {
                if (err) return handleError(err);
                if (!usuario) {
                    const user = new User({
                        name: 'Guest'
                    })
                    user.save().then(savedDoc => {
                        console.log("User salvo com sucesso!")
                        socket.handshake.session.usuario_id = user._id
                        socket.handshake.session.name = user.name
                        socket.handshake.session.save()
                        const stage = new Stage({
                            xplayer: 2,
                            yplayer: -1,
                            usuario_id: user._id,
                            room: '609c0073ef02480d2cd5e542'
                        })
                        stage.save().then(savedDoc => {
                            console.log("Stage salvo com sucesso!")
                            getPlayers();
                        })
                    })
                }
            });
        }
        if (!socket.handshake.session.usuario_id) {
            const user = new User({
                name: 'Guest'
            })
            user.save().then(savedDoc => {
                console.log("User salvo com sucesso!")
                socket.handshake.session.usuario_id = user._id
                socket.handshake.session.name = user.name
                const stage = new Stage({
                    xplayer: 2,
                    yplayer: -1,
                    usuario_id: user._id,
                    room: '609c0073ef02480d2cd5e542'
                })
                stage.save().then(savedDoc => {
                    console.log("Stage salvo com sucesso!")
                    getPlayers()
                })
            })
        }

        function getPlayers() {
            Stage.find({ room: '609c0073ef02480d2cd5e542' }).then((arrayPlayers) => {
                array = []
                players = arrayPlayers
                array.push(players)
                array.push(socket.handshake.session.usuario_id)
                array.push(socket.handshake.session.name)
                socket.emit('sendPlayers', array)
                socket.broadcast.emit('refreshPlayers', players)
            })
            getMessages();
        }

        function getMessages() {
            Chat.find({ room: '609c0073ef02480d2cd5e542' }).then((messages) => {
                socket.emit('previousMessages', messages)
            })
        }

        socket.on('changePlayerPosition', player => {
            players.forEach(p => {
                if (p.usuario_id[0] == player.player_id) {
                    p.xplayer = player.xplayer;
                    p.yplayer = player.yplayer;
                }
            });
            const filter = {
                usuario_id: socket.handshake.session.usuario_id,
                room: '609c0073ef02480d2cd5e542'
            }
            const update = {
                xplayer: player.xplayer,
                yplayer: player.yplayer
            }
            Stage.findOneAndUpdate(filter, update).then((err, doc) => {
                console.log("User Updated");
                Stage.find({ room: '609c0073ef02480d2cd5e542' }).then((arrayPlayers) => {
                    array = []
                    players = arrayPlayers
                    array.push(players)
                    array.push(socket.handshake.session.usuario_id)
                    socket.emit('refreshPlayers', players)
                    socket.broadcast.emit('movePlayer', player)
                })
            })
        })

        socket.on("disconnect", () => {
            User.deleteOne({ _id: socket.handshake.session.usuario_id }, function(err) {
                if (err) return handleError(err);
                // deleted at most one tank document
            })
            Stage.deleteOne({ usuario_id: socket.handshake.session.usuario_id }, function(err) {
                if (err) return handleError(err);
                // deleted at most one tank document
                Stage.find({ room: '609c0073ef02480d2cd5e542' }).then((arrayPlayers) => {
                    array = []
                    players = arrayPlayers
                    array.push(players)
                    array.push(socket.handshake.session.usuario_id)
                    socket.broadcast.emit('refreshPlayers', players)
                })
            })
            console.log("disconectado: " + socket.handshake.session.usuario_id)
        });
    })
}).catch(err => {
    console.log(err);
});

server.listen(PORT);