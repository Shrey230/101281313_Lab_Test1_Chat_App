const port = process.env.PORT || 3000
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const sep = path.sep
const UserModel = require('./Models/User')
const MessageModel = require('./Models/Message')
const io = require('socket.io')(http)

app.use(bodyParser.urlencoded({extended:true}))

const db = "mongodb+srv://shreypatel:shrey2308@comp3133.nj3o5.mongodb.net/LabTest01-ChatApp?retryWrites=true&w=majority"

app.get('/', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}${sep}src${sep}index.html`))
})

app.get('/signup', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}${sep}src${sep}signup.html`))
})

app.post('/signup', async (req, res) => {

    if (!req.body.username || !req.body.firstname || !req.body.lastname || !req.body.password) {
        return res.status(400).redirect('http://localhost:3000/signup')
    }

    const tempUser = new UserModel(
        {
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password: req.body.password,
            createon: new Date()
        }
    )

    await tempUser.save()

    return res.redirect('http://localhost:3000')
})

app.get('/login', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}${sep}src${sep}login.html`))
})

app.post('/login', async(req, res) => {

    const uname = req.body.username.toString()

    const user = await UserModel.findOne({username: uname})

    if (req.body.password.toString() != user.password) {
        return res.status(403).send("Wrong Password")
    } else {
        res.cookie('username', user.username)
        return res.redirect(`http://localhost:3000/chat`)
    }
})

app.get('/chat', (req, res) => {
    res.sendFile(path.resolve(`${__dirname}${sep}src${sep}chat.html`))
})

// SOCKET IO
io.on('connection', (socket) => {
    console.log('Connected: ' + socket.id)

    socket.on('joinRoom', (data) => {
        socket.join(data.room)
        socket.broadcast.to(data.room).emit('newMsg', `${data.username} has joined room: ${data.room}.`)
    })

    socket.on('leaveRoom', (data) => {
        socket.leave(data.room)
        socket.broadcast.to(data.room).emit('newMsg', `${data.username} has left room: ${data.room}.`)
    })

    socket.on('sendMsg', async (messageData) => {

        const Message = new MessageModel()
        let newDate = new Date()
        Message.from_user = messageData.usernamere
        Message.room = messageData.room
        Message.message = messageData.message
        Message.date_sent = newDate.toLocaleString('en-US')
        
        await Message.save()

        let clientMsg = `${newDate.toLocaleTimeString()} - ${messageData.username}: ${messageData.message}`

        socket.broadcast.to(messageData.room).emit('newMsg', clientMsg)
    })

    socket.on('typing', (data) => {
        socket.broadcast.to(data.room).emit('getTyping', data.status)
    })

    socket.on('disconnect', () => {
        console.log('Disconnected')
    })
})

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

http.listen(port, () => {
    console.log('listening at port: ' + port)
})