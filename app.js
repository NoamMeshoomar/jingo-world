const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const cors = require('cors');
const helmet = require('helmet');
const shortid = require('shortid');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}, () => console.log('Connected to MongoDB'));

const beginUrl = '/api/v1';

const usersRoute = require('./routes/users');
const itemsRoute = require('./routes/items');
const userItemsRoute = require('./routes/userItems');
const shopsRoute = require('./routes/shops');

const Users = require('./models/users');
const UserItems = require('./models/UserItems');
const ItemsOnUser = require('./models/ItemsOnUser');

const rooms = require('./rooms/rooms');
const Items = require('./models/Items');

app.use(cors());
app.use(helmet());

app.use(express.json());
app.use(express.static('public'));
app.use('/rooms', express.static('rooms'));
app.use('/items', express.static('items'));

app.use(`${ beginUrl }/users`, usersRoute);
app.use(`${ beginUrl }/items`, itemsRoute);
app.use(`${ beginUrl }/useritems`, userItemsRoute);
app.use(`${ beginUrl }/shops`, shopsRoute);

const tradeInvites = {};
const trades = {};
const categories = ['colors', 'hairs', 'hats', 'stuff', 'necklaces', 'glasses', 'shirts', 'pants', 'skates'];

// 300000

let countdown = 300000;
let oldPrizeId = null;
const prizeDropRoom = 3;

setInterval(() => {
    countdown -= 1000;

    if(countdown <= 0) {
        if(rooms[prizeDropRoom].prize && typeof rooms[prizeDropRoom].prize.id !== 'undefined') oldPrizeId = rooms[prizeDropRoom].prize.id;

        rooms[prizeDropRoom].prize = {
            id: shortid.generate(),
            prizeAmount: Math.floor(Math.random() * 100) + 1,
            position: {
                x: Math.floor(Math.random() * 1100) + 1,
                y: Math.floor(Math.random() * 700) + 1
            }
        }

        const userCount = Object.keys(rooms[prizeDropRoom].users);

        for (let i = 0; i < userCount.length; i++) {
            io.to(userCount[i]).emit('removePrize', oldPrizeId);
            io.to(userCount[i]).emit('prizeDrop', rooms[prizeDropRoom].prize);
        }

        countdown = 300000;
    }
}, 1000);

const SYSTEM_MESSAGE = 0, SUCCESS_MESSAGE = 1, FAILED_MESSAGE = 2, ADMIN_MESSAGE = 3;

io.on('connection', socket => {
    // Creating an user to users object
    socket.on('createUser', (username, password) => {
        Users.findOne({ username: username.toLowerCase() })
        .then(async user => {
            if (user !== null) {
                const validPassword = await bcrypt.compare(password, user.password);

                if (!validPassword) {
                    socket.emit('msg', { message: 'שם משתמש או סיסמה אינם נכונים', type: SYSTEM_MESSAGE });
                } else {
                    if (user.isBanned)
                        return socket.emit('msg', { message: 'המשתמש מורחק...', type: SYSTEM_MESSAGE });

                    // Check if user already in the game
                    // Find the user object if exist

                    let filteredArray = [];

                    rooms.forEach(room => {
                        const filteredUser = Object.values(room.users).filter(({ username }) => {
                            return username.toLowerCase() == user.username;
                        });

                        if(!filteredUser.length) return;

                        filteredArray.push(filteredUser[0]);
                    });

                    if(filteredArray.length > 0) {
                        const { id, room } = filteredArray[0];

                        io.to(id).emit('msg', { message: 'הקשר עם השרת נותק...', type: SYSTEM_MESSAGE });

                        const userCount = Object.keys(rooms[room].users);

                        // Remove the player element with this id
                        for (let i = 0; i < userCount.length; i++) {
                            io.to(userCount[i]).emit('userDisconnected', id);
                        }

                        const usersId = getAllUsersId();

                        if(Object.keys(trades).length > 0) {
                            for(let i = 0; i < Object.keys(trades).length; i++) {
                                const usersInTrade = [Object.keys(trades[Object.keys(trades)[i]].users)[0], Object.keys(trades[Object.keys(trades)[i]].users)[1]];
                                for(let j = 0; j < 2; j++) {
                                    if(findUserInRooms(Object.keys(trades[Object.keys(trades)[i]].users)[j]).username.toLowerCase() == username.toLowerCase()) {
                                        for(let x = 0; x < usersId.length; x++)
                                            io.to(usersId[x]).emit('usersLeaveTrade', usersInTrade);

                                        for(let x = 0; x < usersInTrade.length; x++)
                                            io.to(usersInTrade[x]).emit('closeTrade', socket.id);

                                        rooms[findUserInRooms(Object.keys(trades[Object.keys(trades)[i]].users)[0]).room].users[Object.keys(trades[Object.keys(trades)[i]].users)[0]].inTrade = false;
                                        rooms[findUserInRooms(Object.keys(trades[Object.keys(trades)[i]].users)[1]).room].users[Object.keys(trades[Object.keys(trades)[i]].users)[1]].inTrade = false;

                                        delete trades[Object.keys(trades)[i]];
                                        break;
                                    }
                                }
                            }
                        }

                        delete rooms[room].users[id];
                    }

                    // Check if the user has clothes on him
                    const items = await ItemsOnUser.findOne({ userId: user._id })
                    .populate('color hair hat stuff necklace glasses shirt pants skate background');

                    // Room Spawn Position
                    const spawnPosition = rooms[0].spawnPosition;

                    // Adding a user to the users object
                    rooms[0].users[socket.id] = {
                        id: socket.id,
                        mongoId: user._id,
                        username: user.displayedUsername,
                        position: { x: spawnPosition.x, y: spawnPosition.y },
                        clothes: {
                            color: items?.color ? items.color : null,
                            hair: items?.hair ? items.hair : null,
                            hat: items?.hat ? items.hat : null,
                            stuff: items?.stuff ? items.stuff : null,
                            necklace: items?.necklace ? items.necklace : null,
                            glasses: items?.glasses ? items.glasses : null,
                            shirt: items?.shirt ? items.shirt : null,
                            pants: items?.pants ? items.pants : null,
                            skate: items?.skate ? items.skate : null
                        },
                        room: 0,
                        isAdmin: user.isAdmin,
                        inTrade: false
                    };

                    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

                    // Send the token to the client
                    socket.emit('loginSuccessful', token);
                    socket.emit('loading', true);

                    socket.emit('moveRoom', rooms[0]);

                    // Send new user to everyone and no for the current user
                    for (let i = 0; i < Object.keys(rooms[0].users).length; i++) {
                        socket.broadcast.to(Object.keys(rooms[0].users)[i]).emit('userJoin', rooms[0].users[socket.id]);
                    }

                    // Send the current users in the current room
                    socket.emit('loadUsers', rooms[0].users);

                    setTimeout(() => {
                        socket.emit('loading', false);
                    }, 1000);
                }
            } else {
                socket.emit('msg', { message: 'שם משתמש או סיסמה אינם נכונים', type: SYSTEM_MESSAGE });
            }
        });
    });

    // Move the player to another room
    socket.on('moveRoom', room => {
        if(typeof room !== 'number') return;

        const roomsCount = rooms.length - 1;

        if(room > roomsCount || room < 0) return;

        if (room === null || room === undefined) {
            return;
        } else {
            socket.emit('loading', true);

            const userObj = findUserInRooms(socket.id);

            if (userObj !== undefined) {
                const userRoom = userObj.room;
                const userIds = Object.keys(rooms[userRoom].users);

                if(rooms[room].adminRoom && !userObj.isAdmin) return socket.emit('loading', false);

                // Send the update to the users in prev room
                for (let i = 0; i < userIds.length; i++)
                    io.to(userIds[i]).emit('userDisconnected', rooms[userRoom].users[socket.id].id);

                // Remove the user that clicked from the prev room
                delete rooms[userRoom].users[socket.id];

                // Add the user that clicked to the next room
                rooms[room].users[socket.id] = userObj;

                // Change the current user room value to next room
                rooms[room].users[socket.id].room = room;
                rooms[room].users[socket.id].position.x = rooms[room].spawnPosition.x;
                rooms[room].users[socket.id].position.y = rooms[room].spawnPosition.y;

                const userCount = Object.keys(rooms[room].users);

                // Send the user to the users in the next room
                for (let i = 0; i < userCount.length; i++)
                    socket.broadcast.to(userCount[i]).emit('userJoin', rooms[room].users[socket.id]);

                // Load the users for the current user
                socket.emit('loadUsers', rooms[room].users);

                // Send the new room information to the current user
                socket.emit('moveRoom', rooms[room]);

                setTimeout(() => {
                    socket.emit('loading', false);
                }, 1000);
            }
        }
    });

    // Teleports everyone from the current room to another *Only By Admin*
    socket.on('teleportEveryone', room => {
        if(typeof +room !== 'number') return;
        if(+room < 0 || +room >= rooms.length) return;

        const userObj = findUserInRooms(socket.id);

        if(!userObj) return;
        if(!userObj.isAdmin) return;  
        if(userObj.room === +room) return;     

        const userCount1 = Object.keys(rooms[userObj.room].users);

        // Remove the player element with this id
        for (let i = 0; i < userCount1.length; i++) {
            io.to(userCount1[i]).emit('loading', true);
        }

        const usersArrayFromCurrentRoom = [...Object.values(rooms[userObj.room].users)];

        rooms[userObj.room].users = {};

        for(let i = 0; i < usersArrayFromCurrentRoom.length; i++) {
            usersArrayFromCurrentRoom[i].position.x = rooms[+room].spawnPosition.x;
            usersArrayFromCurrentRoom[i].position.y = rooms[+room].spawnPosition.y;
            usersArrayFromCurrentRoom[i].room = +room;
            rooms[+room].users[usersArrayFromCurrentRoom[i].id] = usersArrayFromCurrentRoom[i];
        }

        const userCount2 = Object.keys(rooms[+room].users);

        // Remove the player element with this id
        for (let i = 0; i < userCount2.length; i++) {
            io.to(userCount2[i]).emit('moveRoom', rooms[+room]);
            io.to(userCount2[i]).emit('loadUsers', rooms[+room].users);
            setTimeout(() => {
                io.to(userCount2[i]).emit('loading', false);
            }, 1000);
        }

        room = null;
    });

    socket.on('prizeCollect', id => {
        if(id == null) return;

        oldPrizeId = null;

        if(id === null || id === undefined) return;
        if(rooms[prizeDropRoom].prize?.id !== id) return;
        if(rooms[prizeDropRoom].users[socket.id] === null || rooms[prizeDropRoom].users[socket.id] === undefined) return;

        Users.findByIdAndUpdate(rooms[prizeDropRoom].users[socket.id].mongoId, { $inc: { money: rooms[prizeDropRoom].prize.prizeAmount } })
        .then(() => {
            socket.emit('msg', {
                message: `מזל טוב ${ rooms[prizeDropRoom].users[socket.id].username } מצאת תיבת אוצר! זכית ב- ${ rooms[prizeDropRoom].prize.prizeAmount } מטבעות!`,
                type: SUCCESS_MESSAGE
            });
            rooms[prizeDropRoom].prize = null;

            const userCount = Object.keys(rooms[prizeDropRoom].users);

            for (let i = 0; i < userCount.length; i++) {
                io.to(userCount[i]).emit('removePrize', id);
            }
        })
        .catch(err => console.error(err));
    });

    // Update the x & y on the server and sending back to client
    socket.on('walking', ({ x, y }) => {
        if(!x instanceof Number || !y instanceof Number) return;
        if (y < 150 || y > 725 || x < 50 || x > 1150) {
            return;
        } else {
            const userObj = findUserInRooms(socket.id);

            if (userObj === undefined) {
                return;
            } else {
                const room = userObj.room;

                rooms[room].users[socket.id].position.x = x;
                rooms[room].users[socket.id].position.y = y;

                const userCount = Object.keys(rooms[room].users);

                // Send the user to the users in the next room
                for (let i = 0; i < userCount.length; i++) {
                    io.to(userCount[i]).emit('walking', rooms[room].users[socket.id]);
                }
            }
        }
    });

    // Put item by itemID on the current user
    socket.on('putItem', userItemId => {
        const userObj = findUserInRooms(socket.id);

        if (userObj !== undefined) {
            const room = userObj.room;

            UserItems.findById(userItemId).populate('userId itemId')
            .then(async ({ userId, itemId }) => {
                if (rooms[room].users[socket.id].mongoId.toString() !== userId._id.toString()) {
                    return;
                } else {
                    // While he have it, it will check if the database has in itemsonuser the current user
                    const userExist = await ItemsOnUser.findOne({ userId });

                    // While not, it will add it to the db with the item on
                    if(!userExist) {
                        return;
                    } else {
                        ItemsOnUser.findOne({ userId })
                        .then(res => {
                            putItemOnUser(res, itemId.category, userId._id, itemId._id, socket.id);
                        });
                    }
                }
            })
            .catch(err => console.error(err));
        }
    });

    // Send chat messages
    socket.on('chatMessage', async ({ msg }) => {
        const badWords = ['זונה', 'מניאק', 'תתאבד', 'כוסעמק', 'תמות', 'חמור', 'טמבל', 'טיפש', 'זין', 'תזדיין', 'שרמוטה', 'כוסאמאשלך', 'fuck', 'bitch', 'shit', 'פאק', 'שיט', 'sex', 'סקס'];

        for(let i = 0; i < badWords.length; i++)
            if(msg.includes(badWords[i])) return socket.emit('msg', { message: 'יש לדבר בשפה נקייה!', type: FAILED_MESSAGE });
        
        const userObj = findUserInRooms(socket.id);

        if (userObj) {
            const user = await Users.findById(userObj.mongoId);
            const room = userObj.room;

            if (user.isMuted) {
                return socket.emit('msg', { message: 'המשתמש מושתק', type: FAILED_MESSAGE });
            } else {
                if (msg.length < 1 || msg.length > 50) {
                    return socket.emit('msg', { message: 'הודעה חייבת להיות 50-1 תויים!', type: SYSTEM_MESSAGE });
                } else if (msg[0].includes('ㅤ') || msg[0].includes(' ')) {
                    return socket.emit('msg', { message: 'יש להקליד הודעה עם יותר מ- 0 תויים!', type: SYSTEM_MESSAGE });
                } else {
                    rooms[room].chatHistory.push({ username: rooms[room].users[socket.id].username, message: msg });

                    const userCount = Object.keys(rooms[room].users);

                    // Send the message to the users in the same room
                    for (let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('chatMessage', { id: rooms[room].users[socket.id].id, msg });
                    }
                }
            }
        }
    });

    // Send screen message to everyone / specific room
    socket.on('screenMessage', ({ msg, msgTo }) => {
        const userObj = findUserInRooms(socket.id);

        const room = userObj.room;

        if(!rooms[room].users[socket.id].isAdmin) return;

        switch(+msgTo) {
            case 0:
                const usersId = getAllUsersId();
                for(let i = 0; i < usersId.length; i++)
                    io.to(usersId[i]).emit('msg', { message: String(msg), type: ADMIN_MESSAGE, sendedBy: findUserInRooms(socket.id).username });
                break;
            case 1:
                // Get every user from the current room
                const userCount = Object.keys(rooms[room].users);

                for (let i = 0; i < userCount.length; i++) {
                    io.to(userCount[i]).emit('msg', { message: String(msg), type: ADMIN_MESSAGE, sendedBy: findUserInRooms(socket.id).username });
                }

                break;
            default:
                return;
        }
    });

    socket.on('dropItem', async userItemId => {
        const userObj = findUserInRooms(socket.id);
        const randomId = shortid.generate();
        const userItem = await UserItems.findById(userItemId).populate('itemId');

        if(!userItem || userItem.userId.toString() !== userObj.mongoId.toString()) return;
        if(userItem.itemId.category === 'colors') return socket.emit('msg', { message: 'אין באפשרותך להשליך פריט זה.', type: SYSTEM_MESSAGE });

        rooms[userObj.room].roomBackground.drops[randomId] = {
            id: randomId,
            itemId: userItem.itemId._id,
            position: { x: userObj.position.x, y: userObj.position.y }
        }

        await UserItems.findByIdAndDelete(userItemId);

        const dropObj = rooms[userObj.room].roomBackground.drops[randomId];

        for(let i = 0; i < Object.keys(rooms[userObj.room].users).length; i++)
            io.to(Object.keys(rooms[userObj.room].users)[i]).emit('dropItem', { id: dropObj.id, position: dropObj.position });

        for(let i = 0; i < Object.keys(userObj.clothes).length; i++) {
            if(Object.values(userObj.clothes)[i]) {
                if(Object.values(userObj.clothes)[i]._id.toString() === userItem.itemId._id.toString()) {
                    const res = await ItemsOnUser.findOne({ userId: userObj.mongoId });
                    putItemOnUser(res, categories[i], userObj.mongoId, Object.values(userObj.clothes)[i]._id, socket.id);
                }
            }
        }
    });

    socket.on('dropCollect', async dropId => {
        const { mongoId, room } = findUserInRooms(socket.id);

        if(!rooms[room].roomBackground.drops[dropId]) return;

        const drop = rooms[room].roomBackground.drops[dropId];

        delete rooms[room].roomBackground.drops[dropId];

        const newUserItem = new UserItems({
            userId: mongoId,
            itemId: drop.itemId
        });

        await newUserItem.save()
        .catch(console.error);

        const { itemImage, itemName } = await Items.findById(drop.itemId);

        socket.emit('dropCollected', { item: { itemImage, itemName } });

        for(let i = 0; i < Object.keys(rooms[room].users).length; i++)
            io.to(Object.keys(rooms[room].users)[i]).emit('removeDrop', dropId);
    });

    // Send trade invite to someone in the game
    socket.on('inviteToTrade', toUser => {
        if(toUser == socket.id) return;

        const { room } = findUserInRooms(socket.id);

        if(!rooms[room].users[socket.id] && !rooms[room].users[toUserId]) return;
        
        const tradeInvitesArr = Object.values(tradeInvites);
        
        for(let i = 0; i < Object.keys(tradeInvites).length; i++)
            if(tradeInvitesArr[i].userId == socket.id && tradeInvitesArr[i].toUserId == toUser) 
                return socket.emit('msg', { message: 'השליחה הקודמת עדיין בתוקף.', type: SYSTEM_MESSAGE });
        

        const id = shortid.generate();
        const expiresIn = Date.now();

        tradeInvites[id] = { 
            id,
            userId: socket.id,
            toUserId: toUser,
            expiresIn
        }

        io.to(toUser).emit('inviteToTrade', tradeInvites[id]);
        socket.emit('inviteToTrade', tradeInvites[id]);
    });

    // Close the invite and remove it for both users
    socket.on('closeTradeInvite', inviteObj => {
        if(!tradeInvites[inviteObj.id]) return;

        const usersInInvite = [tradeInvites[inviteObj.id].userId, tradeInvites[inviteObj.id].toUserId];

        for(let i = 0; i < usersInInvite.length; i++) {
            io.to(usersInInvite[i]).emit('closeTradeInvite', inviteObj.id);
        }       

        delete tradeInvites[inviteObj.id];
    });

    // Accept trade invite
    socket.on('acceptTradeInvite', inviteID => {
        if(!tradeInvites[inviteID]) return;
        if(tradeInvites[inviteID].userId == socket.id) return;

        for(let i = 0; i < Object.keys(trades).length; i++)
            if(Object.values(trades)[i].users[tradeInvites[inviteID].userId]) 
                return socket.emit('המשתמש כרגע עסוק. אנא נסו שוב מאוחר יותר');

        const usersInInvite = [tradeInvites[inviteID].userId, tradeInvites[inviteID].toUserId];

        for(let i = 0; i < usersInInvite.length; i++) {
            io.to(usersInInvite[i]).emit('acceptTradeInvite', tradeInvites[inviteID]);
        }       

        for(let i = 0; i < usersInInvite.length; i++) {
            io.to(usersInInvite[i]).emit('closeTradeInvite', inviteID);
        }

        const userIdRoom = findUserInRooms(tradeInvites[inviteID].userId).room;
        const toUserIdRoom = findUserInRooms(tradeInvites[inviteID].toUserId).room;

        if(userIdRoom == toUserIdRoom) {
            for(let i = 0; i < Object.keys(rooms[userIdRoom].users).length; i++)
                io.to(Object.keys(rooms[userIdRoom].users)[i]).emit('usersJoinedToTrade', [tradeInvites[inviteID].userId, tradeInvites[inviteID].toUserId]);
        } else {
            for(let i = 0; i < Object.keys(rooms[userIdRoom].users).length; i++)
                io.to(Object.keys(rooms[userIdRoom].users)[i]).emit('usersJoinedToTrade', [tradeInvites[inviteID].userId, tradeInvites[inviteID].toUserId]);
            
            for(let i = 0; i < Object.keys(rooms[toUserIdRoom].users).length; i++)
                io.to(Object.keys(rooms[toUserIdRoom].users)[i]).emit('usersJoinedToTrade', [tradeInvites[inviteID].userId, tradeInvites[inviteID].toUserId]);
        }

        trades[inviteID] = {
            acceptState: false,
            users: {
                [tradeInvites[inviteID].userId]: {
                    id: tradeInvites[inviteID].userId,
                    items: [
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                    ],
                    confirmed: false
                },
                [tradeInvites[inviteID].toUserId]: {
                    id: tradeInvites[inviteID].toUserId,
                    items: [
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                    ],
                    confirmed: false
                }
            }
        }

        rooms[userIdRoom].users[tradeInvites[inviteID].userId].inTrade = true;
        rooms[toUserIdRoom].users[tradeInvites[inviteID].toUserId].inTrade = true;

        delete tradeInvites[inviteID];
    });

    socket.on('addItemToTrade', ({ tradeID, itemID }) => {
        if(!trades[tradeID]) return;
        if(!trades[tradeID].users[socket.id]) return;
        if(trades[tradeID].acceptState) return;

        UserItems.findById(itemID).populate('itemId')
        .then(userItem => {
            if(userItem.userId.toString() != findUserInRooms(socket.id).mongoId.toString()) return;
            if(userItem.itemId.category === 'colors') return socket.emit('msg', { message: 'אין באפשרותך להחליף פריט זה.', type: SYSTEM_MESSAGE });
            if(trades[tradeID].users[socket.id].confirmed) return;

            const itemExist = trades[tradeID].users[socket.id].items.filter(item => {
                return item?.userItemId == itemID;
            })[0];

            const currentTradeItems = trades[tradeID].users[socket.id].items;

            if(!itemExist) {
                if(currentTradeItems[0] === null) {
                    currentTradeItems[0] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[1] === null) {
                    currentTradeItems[1] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[2] === null) {
                    currentTradeItems[2] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[3] === null) {
                    currentTradeItems[3] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[4] === null) {
                    currentTradeItems[4] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[5] === null) {
                    currentTradeItems[5] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[6] === null) {
                    currentTradeItems[6] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[7] === null) {
                    currentTradeItems[7] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                } else if(currentTradeItems[8] === null) {
                    currentTradeItems[8] = {
                        userItemId: itemID,
                        itemId: userItem.itemId._id,
                        itemImage: userItem.itemId.itemImage
                    }
                }
            }

            for(let i = 0; i < Object.keys(trades[tradeID].users).length; i++)
                io.to(Object.keys(trades[tradeID].users)[i]).emit('addItemToTrade', { tradeID, userInTrade: { id: socket.id, items: trades[tradeID].users[socket.id].items } });
        })
        .catch(console.error);
    });

    socket.on('removeItemFromTrade', ({ tradeID, itemID }) => {
        if(!trades[tradeID]) return;
        if(!trades[tradeID].users[socket.id]) return;
        if(trades[tradeID].acceptState) return;

        const filteredItem = trades[tradeID].users[socket.id].items.filter(item => {
            return item?.userItemId == itemID;
        })[0];

        const currentBoxIndex = trades[tradeID].users[socket.id].items.indexOf(filteredItem);

        trades[tradeID].users[socket.id].items[currentBoxIndex] = null;

        for(let i = 0; i < Object.keys(trades[tradeID].users).length; i++)
            io.to(Object.keys(trades[tradeID].users)[i]).emit('removeItemFromTrade', trades[tradeID].users[socket.id]);
    });

    socket.on('openAcceptWindow', tradeID => {
        if(!trades[tradeID]) return;
        if(!trades[tradeID].users[socket.id]) return;

        trades[tradeID].acceptState = true;

        for(let i = 0; i < Object.keys(trades[tradeID].users).length; i++)
            io.to(Object.keys(trades[tradeID].users)[i]).emit('openAcceptWindow', tradeID);
    });

    socket.on('acceptTrade', async tradeID => {
        if(!trades[tradeID]) return;
        if(!trades[tradeID].users[socket.id]) return;
        if(!trades[tradeID].acceptState) return;
        if(trades[tradeID].users[socket.id].confirmed) return;

        trades[tradeID].users[socket.id].confirmed = true;

        const filteredUser = Object.values(trades[tradeID].users).filter(user => {
            return user.id != socket.id;
        })[0];

        const myItemsToSend = [];
        const otherUserItemsToSend = [];

        if(Object.values(trades[tradeID].users)[0].confirmed && Object.values(trades[tradeID].users)[1].confirmed) {
            const myFilteredItems = trades[tradeID].users[socket.id].items.filter(item => item !== null);
            const otherUserFilteredItems = trades[tradeID].users[filteredUser.id].items.filter(item => item !== null);

            for(let i = 0; i < myFilteredItems.length; i++)
                myItemsToSend.push({ userId: findUserInRooms(filteredUser.id).mongoId, itemId: myFilteredItems[i].itemId });

            for(let i = 0; i < otherUserFilteredItems.length; i++)
                otherUserItemsToSend.push({ userId: findUserInRooms(socket.id).mongoId, itemId: otherUserFilteredItems[i].itemId });

            if(myItemsToSend.length > 0)
                UserItems.insertMany(myItemsToSend, (err, docs) => {
                    if(err) console.error(err);

                    for(let i = 0; i < myItemsToSend.length; i++)
                        UserItems.findOneAndDelete({ userId: findUserInRooms(socket.id).mongoId, itemId: myItemsToSend[i].itemId })
                        .catch(console.error);
                });

            if(otherUserItemsToSend.length > 0)
                UserItems.insertMany(otherUserItemsToSend, (err, docs) => {
                    if(err) console.error(err);

                    for(let i = 0; i < otherUserItemsToSend.length; i++)
                        UserItems.findOneAndDelete({ userId: findUserInRooms(filteredUser.id).mongoId, itemId: otherUserItemsToSend[i].itemId })
                        .catch(console.error);
                });

            for(let i = 0; i < Object.keys(trades[tradeID].users).length; i++) {
                io.to(Object.keys(trades[tradeID].users)[i]).emit('tradeSuccess', socket.id);
                io.to(Object.keys(trades[tradeID].users)[i]).emit('msg', { message: 'ההחלפה בוצעה בהצלחה!', type: SUCCESS_MESSAGE });
            }

            const room = findUserInRooms(socket.id).room;

            for(let i = 0; i < Object.keys(rooms[room].users).length; i++)
                io.to(Object.keys(rooms[room].users)[i]).emit('usersLeaveTrade', [Object.keys(trades[tradeID].users)[0], Object.keys(trades[tradeID].users)[1]]);    

            delete trades[tradeID];

            const clothes = findUserInRooms(socket.id).clothes;
            const otherUserClothes = findUserInRooms(filteredUser.id).clothes;

            for(let i = 0; i < Object.keys(clothes).length; i++) {
                if(Object.values(clothes)[i]) {
                    for(let j = 0; j < myItemsToSend.length; j++) {
                        if(Object.values(clothes)[i]._id.toString() == myItemsToSend[j].itemId.toString()) {
                            const res = await ItemsOnUser.findOne({ userId: findUserInRooms(socket.id).mongoId });
                            putItemOnUser(res, categories[i], findUserInRooms(socket.id).mongoId, Object.values(clothes)[i]._id, socket.id);
                        }
                    }
                }
            }

            for(let i = 0; i < Object.keys(otherUserClothes).length; i++) {
                if(Object.values(otherUserClothes)[i]) {
                    for(let j = 0; j < otherUserItemsToSend.length; j++) {
                        if(Object.values(otherUserClothes)[i]._id.toString() == otherUserItemsToSend[j].itemId.toString()) {
                            const res = await ItemsOnUser.findOne({ userId: findUserInRooms(filteredUser.id).mongoId });
                            putItemOnUser(res, categories[i], findUserInRooms(filteredUser.id).mongoId, Object.values(otherUserClothes)[i]._id, filteredUser.id);
                        }
                    }
                }
            }
        } else {
            socket.emit('msg', { message: `מחכה לאישור של ${ findUserInRooms(filteredUser.id).username }`, type: SYSTEM_MESSAGE })
        }
    });

    socket.on('closeTrade', tradeID => {
        if(!trades[tradeID]) return;
        if(!trades[tradeID].users[socket.id]) return;

        const usersInTrade = [Object.keys(trades[tradeID].users)[0], Object.keys(trades[tradeID].users)[1]];

        for(let i = 0; i < usersInTrade.length; i++)
            io.to(usersInTrade[i]).emit('closeTrade', socket.id);

        const userRoom = findUserInRooms(usersInTrade[0]).room;
        const user2Room = findUserInRooms(usersInTrade[1]).room;

        if(userRoom == user2Room) {
            for(let i = 0; i < Object.keys(rooms[userRoom].users).length; i++)
                io.to(Object.keys(rooms[userRoom].users)[i]).emit('usersLeaveTrade', usersInTrade);
        } else {
            for(let i = 0; i < Object.keys(rooms[userRoom].users).length; i++)
                io.to(Object.keys(rooms[userRoom].users)[i]).emit('usersLeaveTrade', usersInTrade);

            for(let i = 0; i < Object.keys(rooms[user2Room].users).length; i++)
                io.to(Object.keys(rooms[user2Room].users)[i]).emit('usersLeaveTrade', usersInTrade);
        }

        rooms[userRoom].users[usersInTrade[0]].inTrade = false;
        rooms[user2Room].users[usersInTrade[1]].inTrade = false;

        delete trades[tradeID];
    });

    // Kick a specific user from the game *Only by Admin*
    socket.on('kick', user => {
        if(!user || user.id === undefined || user.id === null) return;

        const { id, room } = user;
        const userObj = findUserInRooms(socket.id);

        if(!userObj.isAdmin) return;
        if(!rooms[room].users[id]) return;

        io.to(id).emit('msg', { message: 'הקשר עם השרת נותק...', type: SYSTEM_MESSAGE });

        // Get every user from the current room
        const userCount = Object.keys(rooms[room].users);

        // Remove the player element with this id
        for (let i = 0; i < userCount.length; i++) {
            io.to(userCount[i]).emit('userDisconnected', id);
        }

        delete rooms[room].users[id];
    });

    // Disconnect a user
    socket.on('disconnect', () => {
        const user = findUserInRooms(socket.id);

        if (user) {
            // Get every user from the current room
            const userCount = Object.keys(rooms[user.room].users);

            // Remove the player element with this id
            for (let i = 0; i < userCount.length; i++)
                io.to(userCount[i]).emit('userDisconnected', user.id);
            

            // Remove the user from the room > users object
            delete rooms[user.room].users[user.id];
        }

        const usersId = getAllUsersId();

        if(Object.keys(trades).length > 0) {
            for(let i = 0; i < Object.keys(trades).length; i++) {
                const usersInTrade = [Object.keys(trades[Object.keys(trades)[i]].users)[0], Object.keys(trades[Object.keys(trades)[i]].users)[1]];

                for(let j = 0; j < 2; j++) {
                    if(Object.keys(trades[Object.keys(trades)[i]].users)[j] == socket.id) {
                        for(let x = 0; x < usersId.length; x++)
                            io.to(usersId[x]).emit('usersLeaveTrade', usersInTrade);

                        for(let x = 0; x < usersInTrade.length; x++)
                            io.to(usersInTrade[x]).emit('closeTrade', socket.id);

                        rooms[findUserInRooms(usersInTrade[0]).room].users[usersInTrade[0]].inTrade = false;
                        rooms[findUserInRooms(usersInTrade[1]).room].users[usersInTrade[1]].inTrade = false;

                        delete trades[Object.keys(trades)[i]];
                        break;
                    }
                }
            }
        }
    });

    socket.on("error", () => { return; });
});

// Return all users id's from every room
function getAllUsersId() {
    const usersId = [];

    for(let i = 0; i < rooms.length; i++)
        for(let j = 0; j < Object.keys(rooms[i].users).length; j++)
            usersId.push(Object.keys(rooms[i].users)[j]);

    return usersId;
}

// Return a specific user object from a room
function findUserInRooms(socketID = null) {
    if(!socketID) return;

    // Get the user that disconnected
    let userObj;

    // Get the user current user object
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].users[socketID]) {
            userObj = rooms[i].users[socketID];
            break;
        }
    }

    return userObj;
}

function putItemOnUser(categories, category, userId, itemId, socketId) {
    const userObj = findUserInRooms(socketId);

    const room = userObj.room;

    switch(category.toString()) {
        case 'colors':
            ItemsOnUser.findOneAndUpdate({ userId }, { color: itemId })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('color')
                .then(({ color }) => {
                    rooms[room].users[socketId].clothes.color = color;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'hairs':
            ItemsOnUser.findOneAndUpdate({ userId }, { hair: categories?.hair?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('hair')
                .then(({ hair }) => {
                    rooms[room].users[socketId].clothes.hair = hair;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'hats':
            ItemsOnUser.findOneAndUpdate({ userId }, { hat: categories?.hat?.toString() !== itemId.toString() ? itemId : null }).populate('hat')
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('hat')
                .then(({ hat }) => {
                    rooms[room].users[socketId].clothes.hat = hat;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'stuff':
            ItemsOnUser.findOneAndUpdate({ userId }, { stuff: categories?.stuff?.toString() !== itemId.toString() ? itemId : null  })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('stuff')
                .then(({ stuff }) => {
                    rooms[room].users[socketId].clothes.stuff = stuff;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'necklaces':
            ItemsOnUser.findOneAndUpdate({ userId }, { necklace: categories?.necklace?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('necklace')
                .then(({ necklace }) => {
                    rooms[room].users[socketId].clothes.necklace = necklace;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'glasses':
            ItemsOnUser.findOneAndUpdate({ userId }, { glasses: categories?.glasses?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('glasses')
                .then(({ glasses }) => {
                    rooms[room].users[socketId].clothes.glasses = glasses;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'shirts':
            ItemsOnUser.findOneAndUpdate({ userId }, { shirt: categories?.shirt?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('shirt')
                .then(({ shirt }) => {
                    rooms[room].users[socketId].clothes.shirt = shirt;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'pants':
            ItemsOnUser.findOneAndUpdate({ userId }, { pants: categories?.pants?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('pants')
                .then(({ pants }) => {
                    rooms[room].users[socketId].clothes.pants = pants;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
        case 'skates':
            ItemsOnUser.findOneAndUpdate({ userId }, { skate: categories?.skate?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('skate')
                .then(({ skate }) => {
                    rooms[room].users[socketId].clothes.skate = skate;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
            ItemsOnUser.findOneAndUpdate({ userId }, { background: categories?.backgrounds?.toString() !== itemId.toString() ? itemId : null })
            .then(() => {
                ItemsOnUser.findOne({ userId }).populate('background')
                .then(({ background }) => {
                    rooms[room].users[socketId].clothes.background = background;

                    const userCount = Object.keys(rooms[room].users);
    
                    for(let i = 0; i < userCount.length; i++) {
                        io.to(userCount[i]).emit('putItem', { id: rooms[room].users[socketId].id, clothes: rooms[room].users[socketId].clothes });
                    }
                });
            });
            break;
    }
}

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));