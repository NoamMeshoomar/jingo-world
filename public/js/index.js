const containerEl = document.querySelector('.container');

const socket = io();

loginEl();

// Users object
let users = {};
let msg = '';
let username = '';
let email = '';
let password = '';
let confirmPassword = '';
let token = ''; 
let teleportsPosition = [];
const messages = [];
const categoriesArray = ['colors', 'hairs', 'hats', 'stuff', 'necklaces', 'glasses', 'shirts', 'pants', 'skates'];

const beginUrl = '/api/v1';
const itemsPath = '/items';

// Load the user that just joined to every one else in the game
socket.on('userJoin', user => {
    users[user.id] = { ...user };

    const newUser = new User(user.id, user.username, user.position, user.clothes, user.isAdmin, user.inTrade);

    newUser.createUser();
});

// Load the users only for the person that just joined
socket.on('loadUsers', data => {
    const playersContainer = document.querySelector('.players');

    playersContainer.innerHTML = '';

    users = data;

    const userValues = Object.values(data);

    for(let i = 0; i < Object.keys(data).length; i++) {
        const newUser = new User(
            userValues[i].id, 
            userValues[i].username, 
            userValues[i].position, 
            userValues[i].clothes,
            userValues[i].isAdmin,
            userValues[i].inTrade
        );

        newUser.createUser();
    }
});

// Recieve message from the server
socket.on('chatMessage', message => {
    messages.push({ ...message, expireTime: Date.now() + 5000 });
});

socket.on('dropItem', item => {
    createDropEl(item.id, item.position);
});

socket.on('dropCollected', ({ item }) => {
    const gameEl = document.querySelector('.game');

    const dropCollectedPopup = document.createElement('div');
    dropCollectedPopup.classList.add('drop_collected');
    
    const title = document.createElement('h1');
    title.textContent = 'מזל טוב! תפסתם פריט';

    const itemImage = document.createElement('img');
    itemImage.classList.add('item_image');
    itemImage.src = itemsPath + item.itemImage;

    const itemName = document.createElement('h3');
    itemName.textContent = item.itemName;

    const closeBtn = document.createElement('img');
    closeBtn.src = '../assets/message/success-btn.png';
    closeBtn.style.cursor = 'pointer';

    closeBtn.onclick = () => dropCollectedPopup.remove();

    dropCollectedPopup.appendChild(title);
    dropCollectedPopup.appendChild(itemName);
    dropCollectedPopup.appendChild(itemImage);
    dropCollectedPopup.appendChild(closeBtn);
    gameEl.appendChild(dropCollectedPopup);
});

socket.on('removeDrop', dropId => document.querySelector(`[data-drop="${ dropId }"]`).remove());

// Recieve the room from the server
socket.on('moveRoom', ({ roomBackground, prize }) => {
    const gameBackground = document.querySelector('.game .game-background');
    const teleports = document.querySelector('.game .game-background .teleports');
    const items = document.querySelector('.game .game-background .items');
    const shops = document.querySelector('.game .game-background .shops');
    const drops = document.querySelector('.game .game-background .drops');
    const prizeEl = document.querySelector('.game .game-background .prize');

    const backgroundImage = document.querySelector('.game .game-background .background-image');
    backgroundImage.src = roomBackground.backgroundImage;

    teleports.innerHTML = '';
    items.innerHTML = '';
    shops.innerHTML = '';
    drops.innerHTML = '';
    if(gameBackground.querySelector('.npc'))
        gameBackground.querySelector('.npc').remove();
    if(prizeEl)
        prizeEl.remove();

    if(roomBackground.teleports) {
        roomBackground.teleports.forEach(({ teleportImage, teleportImagePosition, teleportTo }) => {
            teleportsPosition.push({
                position: { x: teleportImagePosition.x, y: teleportImagePosition.y },
                teleportTo
            });
            const teleportImageEl = document.createElement('img');
            teleportImageEl.classList.add('teleport-image');
            teleportImageEl.src = teleportImage;
            teleportImageEl.setAttribute('data-room', teleportTo);
    
            teleportImageEl.style.left = `${ teleportImagePosition.x }px`;
            teleportImageEl.style.top = `${ teleportImagePosition.y }px`;
            teleportImageEl.style.zIndex = teleportImagePosition.y;

            teleportImageEl.addEventListener('click', () => socket.emit('moveRoom', teleportTo));
    
            teleports.appendChild(teleportImageEl);
        });
    }

    if(roomBackground.items) {
        roomBackground.items.forEach(({ itemImage, itemImagePosition }) => {
            const itemImageEl = document.createElement('img');
            itemImageEl.src = itemImage;
    
            itemImageEl.style.position = 'absolute';
            itemImageEl.style.transform = 'translate(-50%, -95%)';
            itemImageEl.style.top = `${ itemImagePosition.y }px`;
            itemImageEl.style.left = `${ itemImagePosition.x }px`;
            itemImageEl.style.zIndex = itemImagePosition.y;
            items.style.pointerEvents = 'none';
    
            items.appendChild(itemImageEl);
        });
    }

    if(roomBackground.shops) {
        roomBackground.shops.forEach(({ shopId, shopImage, shopImagePosition }) => {
            const shopImageEl = document.createElement('img');
            shopImageEl.src = shopImage;
    
            shopImageEl.style.position = 'absolute';
            shopImageEl.style.transform = 'translate(-50%, -95%)';
            shopImageEl.style.top = `${ shopImagePosition.y }px`;
            shopImageEl.style.left = `${ shopImagePosition.x }px`;
            shopImageEl.style.zIndex = shopImagePosition.y;
            shopImageEl.style.cursor = 'pointer';

            shopImageEl.onclick = () => shopEl(shopId);
    
            shops.appendChild(shopImageEl);
        });
    }

    if(roomBackground.drops)
        Object.values(roomBackground.drops).forEach(({ id, position }) => createDropEl(id, position));

    if(roomBackground.npc) {
        const npcEl = document.createElement('div');
        const npcImage = document.createElement('img');
        const npcName = document.createElement('h3');
        const sentencesEl = document.createElement('div');
        sentencesEl.classList.add('sentences');
        const sentencesText = document.createElement('p');
        sentencesEl.appendChild(sentencesText);

        const sentencesArr = roomBackground.npc.sentences;
        const sentencesLength = roomBackground.npc.sentences.length;
        let sentenceVisible = true;
        let currentSentenceIndex = 0;
        sentencesEl.style.visibility = 'hidden';

        setInterval(() => {
            if(sentenceVisible) {
                sentencesEl.style.visibility = 'visible';
                sentencesText.textContent = sentencesArr[currentSentenceIndex];
                currentSentenceIndex++;
                sentenceVisible = false;
                if(currentSentenceIndex >= sentencesLength) currentSentenceIndex = 0;
            } else {
                sentencesEl.style.visibility = 'hidden';
                sentenceVisible = true;
            }
        }, 10000);

        npcEl.classList.add('npc');

        npcEl.style.left = roomBackground.npc.npcPosition.x + 'px';
        npcEl.style.top = roomBackground.npc.npcPosition.y + 'px';
        npcEl.style.zIndex = roomBackground.npc.npcPosition.y;

        npcEl.appendChild(sentencesEl);

        npcImage.src = roomBackground.npc.npcImage;
        npcEl.appendChild(npcImage);

        npcName.textContent = roomBackground.npc.npcName;
        npcEl.appendChild(npcName);

        gameBackground.appendChild(npcEl);
    }

    if(prize) createPrizeEl(prize.id, prize.position);
});

// After the click on specific item, The server put the item on the client and send the item
socket.on('putItem', ({ id, clothes }) => {
    users[id].clothes = clothes;
    const playerEl = document.querySelectorAll(`[data-id="${ id }"]`)[0];

    const playerItemsEl = playerEl.querySelector('.items');

    for(let i = 0; i < Object.keys(clothes).length; i++) {
        if(clothes[`${ Object.keys(clothes)[i] }`] !== null) {
            const categoryItemEl = playerItemsEl.querySelector(`.${ categoriesArray[i] }`);
            categoryItemEl.style.left = null;
            categoryItemEl.style.top = null;
            categoryItemEl.querySelector('img').src = itemsPath + clothes[`${ Object.keys(clothes)[i] }`].itemImage;
            categoryItemEl.style.left = clothes[`${ Object.keys(clothes)[i] }`].position.x + 'px';
            categoryItemEl.style.top = clothes[`${ Object.keys(clothes)[i] }`].position.y + 'px';
        } else {
            playerItemsEl.querySelector(`.${ categoriesArray[i] }`).querySelector('img').removeAttribute('src');
        }
    }
});

socket.on('prizeDrop', ({ id, position }) => {
    createPrizeEl(id, position);
});

socket.on('removePrize', id => {
    const prizeEl = document.querySelectorAll(`[data-prize='${ id }']`)[0];
    if(prizeEl === null || prizeEl === undefined) return;

    prizeEl.remove();
});

// User movement data from server
socket.on('walking', ({ id, position }) => {
    const playerEl = document.querySelector(`[data-id="${ id }"]`);

    users[id].position.x = position.x;
    users[id].position.y = position.y;

    playerEl.style.left = `${ position.x }px`;
    playerEl.style.top = `${ position.y }px`;
    playerEl.style.zIndex = position.y;

    // let walking = true;

    // while(true) {
    //     if(!walking) {
    //         console.log('Hello World');
    //         break;
    //     }
    // }

    // playerEl.addEventListener('trsitionend', e => {
    //     if(e.propertyName === 'top') {
    //         walking = false;
    //     }
    // });
});

// turn on the loading screen while loading is true from the server
socket.on('loading', isLoading => {
    if(isLoading) {
        loadingEl();
    } else {
        const loadingEl = document.querySelector('.loading');

        containerEl.removeChild(loadingEl);
    }
});

socket.on('inviteToTrade', inviteObj => {
    const tradeInvitesContainer = document.querySelector('.trade-invites');

    const tradeInvite = document.createElement('div');
    tradeInvite.setAttribute('data-invite', inviteObj.id);
    tradeInvite.classList.add('trade-invite');

    const name = document.createElement('h3');

    const btnsContainer = document.createElement('div');
    btnsContainer.classList.add('btns-container');

    name.textContent = users[inviteObj.toUserId].username;

    if(inviteObj.userId !== socket.id) {
        name.textContent = users[inviteObj.userId].username;

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'V';
        btnsContainer.appendChild(acceptBtn);

        acceptBtn.addEventListener('click', () => socket.emit('acceptTradeInvite', inviteObj.id));
    }

    const closeInvite = document.createElement('button');
    closeInvite.textContent = 'X';

    btnsContainer.appendChild(closeInvite);

    tradeInvite.appendChild(name);
    tradeInvite.appendChild(btnsContainer);
    tradeInvitesContainer.appendChild(tradeInvite);

    closeInvite.addEventListener('click', () => {
        socket.emit('closeTradeInvite', inviteObj);
    });
});

socket.on('closeTradeInvite', inviteID => {
    const inviteEl = document.querySelector(`[data-invite="${ inviteID }"]`);

    inviteEl.remove();
});

socket.on('usersJoinedToTrade', usersInTrade => {
    const player1El = document.querySelector(`[data-id="${ usersInTrade[0] }"]`);
    const player2El = document.querySelector(`[data-id="${ usersInTrade[1] }"]`);

    const inTradeIcon = document.createElement('img');
    inTradeIcon.src = '../assets/trades/in_trade.png';
    inTradeIcon.classList.add('in_trade');

    const inTrade2Icon = document.createElement('img');
    inTrade2Icon.src = '../assets/trades/in_trade.png';
    inTrade2Icon.classList.add('in_trade');

    if(player1El)
        player1El.appendChild(inTradeIcon);
    if(player2El)
        player2El.appendChild(inTrade2Icon);
});

socket.on('usersLeaveTrade', usersInTrade => {
    const player1El = document.querySelector(`[data-id="${ usersInTrade[0] }"]`) ?? null;
    const player2El = document.querySelector(`[data-id="${ usersInTrade[1] }"]`) ?? null;

    if(player1El !== null)
        player1El.querySelector('.in_trade').remove();
    if(player2El !== null)
        player2El.querySelector('.in_trade').remove();
});

socket.on('acceptTradeInvite', inviteObj => tradeEl(inviteObj));

socket.on('addItemToTrade', ({ tradeID, userInTrade }) => {
    const tradeEl = document.querySelector('.game .trade');
    const tradeBoxes = tradeEl.querySelectorAll(`${ userInTrade.id !== socket.id ? '.opponent_trade_area' : '.my_trade_area' } .trade_box`);

    for(let i = 0; i < userInTrade.items.length; i++) {
        tradeBoxes[i].innerHTML = '';
        if(userInTrade.items[i]) {
            if(!tradeBoxes[i].contains(tradeBoxes[i].querySelector('img'))) {
                const itemImage = document.createElement('img');
                itemImage.src = itemsPath + userInTrade.items[i].itemImage;
                tradeBoxes[i].appendChild(itemImage);
                tradeBoxes[i].setAttribute('data-item', userInTrade.items[i].userItemId);
                tradeBoxes[i].style.cursor = 'pointer';
                tradeBoxes[i].onclick = () => socket.emit('removeItemFromTrade', { tradeID, itemID: tradeBoxes[i].getAttribute('data-item') });
            }
        };
    }
});

socket.on('removeItemFromTrade', userInTrade => {
    const tradeEl = document.querySelector('.game .trade');
    const tradeBoxes = tradeEl.querySelectorAll(`${ userInTrade.id !== socket.id ? '.opponent_trade_area' : '.my_trade_area' } .trade_box`);
    
    for(let i = 0; i < userInTrade.items.length; i++) {
        if(!userInTrade.items[i]) {
            tradeBoxes[i].removeAttribute('data-item');
            if(tradeBoxes[i].querySelector('img'))
                tradeBoxes[i].querySelector('img').remove();
            tradeBoxes[i].style.cursor = 'auto';
        }
    }
});

socket.on('tradeSuccess', () => {
    const tradeEl = document.querySelector('.game .trade');
    tradeEl.remove();
})

socket.on('closeTrade', userCanceled => {
    const tradeEl = document.querySelector('.game .trade');
    tradeEl.remove();

    if(userCanceled !== socket.id) messageEl('השותף עזב את ההחלפה.', 0);
});

socket.on('openAcceptWindow', tradeID => acceptWindowTrade(tradeID));

// User disconnected
socket.on('userDisconnected', id => {
    const playersContainer = document.querySelector('.game .players');
    const playerEl = document.querySelectorAll(`[data-id="${ id }"]`);

    if(!users[id]) {
        return;
    } else {
        playersContainer.removeChild(playerEl[0]);

        delete users[id];
    }
});

// Get the error message from the server
socket.on('msg', ({ message, type, sendedBy = null }) => {
    messageEl(message, type, sendedBy);

    if(message === 'הקשר עם השרת נותק...')
        setTimeout(() => window.location.reload(), 5000);
});

// User class for user creation
class User {
    constructor(id, username, position, clothes, isAdmin, inTrade) {
        this.id = id;
        this.username = username;
        this.position = position;
        this.clothes = clothes;
        this.isAdmin = isAdmin;
        this.inTrade = inTrade;
    }

    createUser = () => {
        const playersContainer = document.querySelector('.players');

        // Creating the player element
        const div = document.createElement('div');
        div.classList.add('player');
        div.setAttribute('data-id', this.id);
        div.style.left = `${ this.position.x }px`;
        div.style.top = `${ this.position.y }px`;
        div.style.zIndex = +this.position.y;
        if(this.id != socket.id)
            div.style.cursor = 'pointer';

        // Username text h3 element
        const usernameText = document.createElement('div');
        usernameText.classList.add('username');
        usernameText.textContent = this.username;
    
        div.appendChild(usernameText);
    
        // Message Bubble
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');
    
        const h3 = document.createElement('h3');
        h3.textContent = '';
    
        if(this.isAdmin) {
            messageBubble.style.border = '1px solid rgb(0, 162, 255)';
            h3.style.color = 'rgb(0, 162, 255)';
            h3.style.fontWeight = '500';
        }

        if(this.inTrade) {
            const inTradeIcon = document.createElement('img');
            inTradeIcon.src = '../assets/trades/in_trade.png';
            inTradeIcon.classList.add('in_trade');
            div.appendChild(inTradeIcon);
        }
    
        messageBubble.appendChild(h3);
        div.appendChild(messageBubble);
    
        div.onclick = () => getUserCard(this.id);

        // Items on player
        const itemsContainer = document.createElement('div');
        itemsContainer.classList.add('items');
    
        for(let i = 0; i < categoriesArray.length; i++) {
            const itemEl = document.createElement('div');
            itemEl.classList.add('itemonuser');
            itemEl.classList.add(`${ categoriesArray[i] }`);
        
            const itemImageEl = document.createElement('img');

            itemEl.appendChild(itemImageEl);
        
            itemsContainer.appendChild(itemEl);
        }

        div.appendChild(itemsContainer);
    
        if(this.isAdmin) {
            const adminIcon = document.createElement('img');
            adminIcon.classList.add('admin-icon');
            adminIcon.src = '../assets/adminIcon.png';
    
            div.appendChild(adminIcon);
        }

        for(let i = 0; i < Object.keys(this.clothes).length; i++) {
            if(this.clothes[`${ Object.keys(this.clothes)[i] }`] !== null) {
                const categoryItemEl = div.querySelector('.items').querySelector(`.${ categoriesArray[i] }`);
                categoryItemEl.querySelector('img').src = itemsPath + this.clothes[`${ Object.keys(this.clothes)[i] }`].itemImage;
                categoryItemEl.style.left = this.clothes[`${ Object.keys(this.clothes)[i] }`].position.x + 'px';
                categoryItemEl.style.top = this.clothes[`${ Object.keys(this.clothes)[i] }`].position.y + 'px';
            }
        }
    
        if(playersContainer !== null) playersContainer.appendChild(div);
    }
}

(function update() {
    requestAnimationFrame(update);

    messages.forEach(msg => {
        const playerEl = document.querySelectorAll(`[data-id="${ msg.id }"]`);

        if(!playerEl[0] && typeof playerEl[0] === 'undefined') {
            const index = messages.indexOf(msg);
            return messages.splice(index, 1);
        }

        const messageBubble = playerEl[0].querySelector('.message-bubble');
        const messageBubbleText = messageBubble.querySelector('h3');

        messageBubbleText.textContent = msg.msg;
        messageBubble.style.visibility = 'visible';

        if(msg.expireTime <= Date.now()) {
            messageBubble.style.visibility = 'hidden';
            messageBubbleText.textContent = '';

            const index = messages.indexOf(msg);
            messages.splice(index, 1);
        }
    });
})();

// Admin panel
function adminPanelEl() {
    const gameEl = document.querySelector('.game');

    let user = '';
    let item = '';
    let msg = '';
    let msgTo = '';
    let tpTo = '';

    const div = document.createElement('div');
    div.classList.add('admin-panel');

    const closeBtn = document.createElement('h3');
    closeBtn.classList.add('close-btn');
    closeBtn.textContent = 'X';

    const title = document.createElement('h1');
    title.textContent = 'פאנל מנהלים';

    div.appendChild(closeBtn);
    div.appendChild(title);

    const adminPanelContainer = document.createElement('div');
    adminPanelContainer.classList.add('admin-panel-container');

    const userPunishments = document.createElement('div');
    userPunishments.classList.add('user-punishments');

    // Ban form
    const banForm = document.createElement('form');
    banForm.classList.add('ban-form');

    const banFormInput = document.createElement('input');
    banFormInput.placeholder = 'שם המשתמש';

    const banFormBtn = document.createElement('button');
    banFormBtn.type = 'submit';
    banFormBtn.textContent = 'Ban / Unban';

    banForm.appendChild(banFormInput);
    banForm.appendChild(banFormBtn);

    const banFormText = document.createElement('h3');

    // Mute form
    const muteForm = document.createElement('form');
    muteForm.classList.add('mute-form');

    const muteFormInput = document.createElement('input');
    muteFormInput.placeholder = 'שם המשתמש';

    const muteFormBtn = document.createElement('button');
    muteFormBtn.type = 'submit';
    muteFormBtn.textContent = 'Mute / Unmute';

    muteForm.appendChild(muteFormInput);
    muteForm.appendChild(muteFormBtn);

    const muteFormText = document.createElement('h3');

    // Kick form
    const kickForm = document.createElement('form');
    kickForm.classList.add('kick-form');

    const kickFormInput = document.createElement('input');
    kickFormInput.placeholder = 'שם המשתמש';

    const kickFormBtn = document.createElement('button');
    kickFormBtn.type = 'submit';
    kickFormBtn.textContent = 'Kick';

    kickForm.appendChild(kickFormInput);
    kickForm.appendChild(kickFormBtn);

    userPunishments.appendChild(banForm);
    userPunishments.appendChild(muteForm);
    userPunishments.appendChild(kickForm);
    
    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('events');

    // Give item form
    const giveItemForm = document.createElement('form');
    giveItemForm.classList.add('giveitem-form');

    const giveItemFormInputUser = document.createElement('input');
    giveItemFormInputUser.placeholder = 'שם המשתמש';

    const giveItemFormInputItem = document.createElement('input');
    giveItemFormInputItem.placeholder = 'פריט';

    const giveItemFormBtn = document.createElement('button');
    giveItemFormBtn.type = 'submit';
    giveItemFormBtn.textContent = 'Give item';

    giveItemForm.appendChild(giveItemFormInputUser);
    giveItemForm.appendChild(giveItemFormInputItem);
    giveItemForm.appendChild(giveItemFormBtn);

    const giveItemFormText = document.createElement('h3');

    // Screen Message Form

    const screenMessage = document.createElement('form');
    screenMessage.classList.add('screen-message');

    const textArea = document.createElement('textarea');
    textArea.placeholder = 'הקלד הודעת מסך...';

    const lowerContainer = document.createElement('div');

    const toMsg = document.createElement('input');
    toMsg.placeholder = '0All / 1Room';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Send Screen Message';

    lowerContainer.appendChild(toMsg);
    lowerContainer.appendChild(confirmBtn);

    screenMessage.appendChild(textArea);
    screenMessage.appendChild(lowerContainer);

    // Teleport everyone to room

    const teleportEveryoneForm = document.createElement('form');
    teleportEveryoneForm.classList.add('teleport-everyone');

    const teleportInput = document.createElement('input');
    teleportInput.placeholder = 'Room Number';

    const teleportBtn = document.createElement('button');
    teleportBtn.textContent = 'Teleport Everyone';

    teleportEveryoneForm.appendChild(teleportInput);
    teleportEveryoneForm.appendChild(teleportBtn);

    eventsContainer.appendChild(giveItemForm);
    eventsContainer.appendChild(screenMessage);
    eventsContainer.appendChild(teleportEveryoneForm);
    
    adminPanelContainer.appendChild(userPunishments);
    adminPanelContainer.appendChild(eventsContainer);

    div.appendChild(adminPanelContainer);
    gameEl.appendChild(div);

    banFormInput.addEventListener('input', e => user = e.target.value);
    muteFormInput.addEventListener('input', e => user = e.target.value);
    kickFormInput.addEventListener('input', e => user = e.target.value);
    giveItemFormInputUser.addEventListener('input', e => user = e.target.value);
    giveItemFormInputItem.addEventListener('input', e => item = e.target.value);
    textArea.addEventListener('input', e => msg = e.target.value);
    toMsg.addEventListener('input', e => msgTo = e.target.value);
    teleportInput.addEventListener('input', e => tpTo = e.target.value);

    banForm.addEventListener('submit', e => {
        e.preventDefault();

        fetch(`${ beginUrl }/users/ban`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': token
            },
            body: JSON.stringify({
                user
            })
        })
        .then(res => res.json())
        .then(({ message }) => {
            banFormText.textContent = message;

            banForm.appendChild(banFormText);
        });

        banFormInput.value = '';
    });

    muteForm.addEventListener('submit', e => {
        e.preventDefault();

        fetch(`${ beginUrl }/users/mute`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': token
            },
            body: JSON.stringify({
                user
            })
        })
        .then(res => res.json())
        .then(({ message }) => {
            console.log(message);
            muteFormText.textContent = message;

            muteForm.appendChild(muteFormText);
        });

        muteFormInput.value = '';
    });

    kickForm.addEventListener('submit', e => {
        e.preventDefault();

        if(!users[socket.id].isAdmin) return;

        let filteredUser;

        for(let i = 0; i < Object.keys(users).length; i++) {
            filteredUser = Object.values(users).filter(fUser => {
                return fUser.username.toLowerCase() === user.toLowerCase();
            });
        }

        if(filteredUser.length < 0 || filteredUser > 0) return;

        socket.emit('kick', filteredUser[0]);
    });

    giveItemForm.addEventListener('submit', e => {
        e.preventDefault();

        fetch(`${ beginUrl }/useritems/giveitem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': token
            },
            body: JSON.stringify({
                user,
                item
            })
        })
        .then(res => res.json())
        .then(({ message }) => {
            giveItemFormText.textContent = message;

            giveItemForm.appendChild(giveItemFormText);
        });

        giveItemFormInputUser.value = '';
        giveItemFormInputItem.value = '';
    });

    screenMessage.addEventListener('submit', e => {
        e.preventDefault();

        textArea.value = '';
        toMsg.value = '';

        socket.emit('screenMessage', { msg, msgTo });
    });

    teleportEveryoneForm.addEventListener('submit', e => {
        e.preventDefault();

        teleportInput.value = '';

        socket.emit('teleportEveryone', tpTo);
    });

    closeBtn.addEventListener('click', () => {
        const adminPanel = document.querySelector('.game .admin-panel');

        gameEl.removeChild(adminPanel);
    });
}

// Creating the game screen elements
function gameEl() {    
    // Game element
    const div = document.createElement('div');
    div.classList.add('game');

    // Game background
    const gameBackground = document.createElement('div');
    gameBackground.classList.add('game-background');

    const background = document.createElement('img');
    background.classList.add('background-image');

    const teleports = document.createElement('div');
    teleports.classList.add('teleports');

    const items = document.createElement('div');
    items.classList.add('items');

    const shops = document.createElement('div');
    shops.classList.add('shops');

    const drops = document.createElement('div');
    drops.classList.add('drops');

    gameBackground.appendChild(background);
    gameBackground.appendChild(teleports);
    gameBackground.appendChild(items);
    gameBackground.appendChild(shops);
    gameBackground.appendChild(drops);

    const itemsEl = document.createElement('div');
    itemsEl.classList.add('items');

    // Players container element
    const playersEl = document.createElement('div');
    playersEl.classList.add('players');

    // Bottom bar
    const bottomBar = document.createElement('div');
    bottomBar.classList.add('bottom-bar');

    // Inventory btn
    const inventoryBtn = document.createElement('div');
    inventoryBtn.classList.add('inventory-btn');

    const inventoryBtnIcon = document.createElement('img');
    inventoryBtnIcon.src = './assets/bag.svg';

    inventoryBtn.appendChild(inventoryBtnIcon);

    bottomBar.appendChild(inventoryBtn);

    // Open the inventory
    inventoryBtn.addEventListener('click', () => {
        const inventory = document.querySelector('.inventory');

        if(div.contains(inventory)) {
            div.removeChild(inventory);
        } else {
            inventoryEl();
        }
    });

    const tradeInvitesContainer = document.createElement('div');
    tradeInvitesContainer.classList.add('trade-invites');

    // Chat form
    const chatForm = document.createElement('form');
    chatForm.classList.add('chat-form');

    const chatFormInput = document.createElement('input');
    chatFormInput.classList.add('chat-input');
    chatFormInput.placeholder = 'הקלד/י הודעה';

    const chatFormBtn = document.createElement('button');
    chatFormBtn.textContent = 'שלח';

    chatForm.appendChild(chatFormInput);
    chatForm.appendChild(chatFormBtn);

    // Set the message on the msg varible
    chatFormInput.addEventListener('input', e => msg = e.target.value);

    // Send the message for the server
    chatForm.addEventListener('submit', e => {
        e.preventDefault();
            
        socket.emit('chatMessage', { msg });

        msg = '';
        chatFormInput.value = '';
    });

    bottomBar.appendChild(chatForm);

    div.appendChild(playersEl);
    div.appendChild(bottomBar);
    div.appendChild(tradeInvitesContainer);
    div.appendChild(gameBackground);

    containerEl.appendChild(div);

    // top .5s linear, left .5s linear;
    // Sends the x, y position to server
    playersEl.addEventListener('click', e => {
        if(e.offsetY < 150 || e.offsetY > 725 || e.offsetX < 50 || e.offsetX > 1150) {
            return;
        } else {
            socket.emit('walking', { x: e.offsetX, y: e.offsetY });
        }
    });
    
    // Check if user is Admin if its true is render the admin panel El
    setTimeout(() => {
        if(users[socket.id].isAdmin) {
            const adminPanelBtn = document.createElement('div');
            adminPanelBtn.classList.add('admin-panel-btn');

            const adminPanelBtnText = document.createElement('h3');
            adminPanelBtnText.textContent = 'M';

            adminPanelBtn.appendChild(adminPanelBtnText);

            bottomBar.appendChild(adminPanelBtn);

            adminPanelBtn.addEventListener('click', () => {
                const gameEl = document.querySelector('.game');
                const adminPanel = document.querySelector('.game .admin-panel');

                if(gameEl.contains(adminPanel)) {
                    return;
                } else {
                    adminPanelEl();
                }
            });
        }
    }, 300);
}

// Function the create the inventory element
function inventoryEl() {
    const gameEl = document.querySelector('.game');

    const div = document.createElement('div');
    div.classList.add('inventory');

    const closeBtn = document.createElement('div');
    closeBtn.classList.add('close-btn');

    const displayUser = document.createElement('div');
    displayUser.classList.add('display-user');

    const userDisplay = getUserDisplay(socket.id, 1.2);

    div.appendChild(userDisplay);

    const usernameText = document.createElement('h3');
    usernameText.classList.add('username');
    
    displayUser.appendChild(usernameText);

    const moneyText = document.createElement('h3');
    moneyText.classList.add('money');

    // Categories
    const categories = document.createElement('div');
    categories.classList.add('categories');

    const itemsEl = document.createElement('div');
    itemsEl.classList.add('items');

    const itemDetails = document.createElement('div');
    itemDetails.classList.add('item_details');

    const itemDetailsImage = document.createElement('img');
    const leftDetails = document.createElement('div');
    const itemName = document.createElement('h3');
    const forLevel = document.createElement('p');

    leftDetails.appendChild(itemName);
    leftDetails.appendChild(forLevel);

    itemDetails.appendChild(itemDetailsImage);
    itemDetails.appendChild(leftDetails);

    div.appendChild(itemDetails);

    let ctrlPressed = false;

    for(let i = 0; i < categoriesArray.length; i++) {
        const category = document.createElement('span');
        category.classList.add('category');
        category.setAttribute('data-category', categoriesArray[i]);

        const categoryImage = document.createElement('img');
        categoryImage.src = `../assets/categories/${ i }.png`;

        category.appendChild(categoryImage);
        categories.appendChild(category);

        category.addEventListener('click', async () => {
            const items = await getCategoriesItems(category.getAttribute('data-category'));
            
            itemsEl.innerHTML = '';

            items.forEach(item => {
                const itemBox = document.createElement('div');
                itemBox.classList.add('item');
                itemBox.setAttribute('data-item', item._id);

                const itemImage = document.createElement('img');
                itemImage.src = itemsPath + item.itemId.itemImage;

                itemBox.appendChild(itemImage);
                itemsEl.appendChild(itemBox);

                itemBox.addEventListener('mouseenter', () => {
                    itemDetailsImage.src = itemsPath + item.itemId.itemImage;
                    itemName.textContent = item.itemId.itemName;
                    forLevel.textContent = 'לרמה: 1';
                });

                document.addEventListener('keydown', e => {
                    if(e.key === 'Control') ctrlPressed = true;
                });

                document.addEventListener('keyup', e => {
                    if(e.key === 'Control') ctrlPressed = false;
                });

                itemBox.addEventListener('click', () => {
                    if(ctrlPressed) {
                        const acceptWindow = document.createElement('div');
                        acceptWindow.classList.add('accept_window_drop');

                        const title = document.createElement('h1');
                        title.textContent = 'השלכת חפץ';

                        const subtitle = document.createElement('h3');
                        subtitle.textContent = 'נא לאשר השלכת:';

                        const itemName = document.createElement('p');
                        itemName.textContent = item.itemId.itemName;

                        const itemImage = document.createElement('img');
                        itemImage.src = itemsPath + item.itemId.itemImage;

                        const buttons = document.createElement('div');
                        buttons.classList.add('buttons');
                        
                        const acceptBtn = document.createElement('button');
                        acceptBtn.textContent = 'אשר';

                        const cancelBtn = document.createElement('button');
                        cancelBtn.textContent = 'בטל';

                        buttons.appendChild(acceptBtn);
                        buttons.appendChild(cancelBtn);

                        acceptWindow.appendChild(title);
                        acceptWindow.appendChild(subtitle);
                        acceptWindow.appendChild(itemName);
                        acceptWindow.appendChild(itemImage);
                        acceptWindow.appendChild(buttons);

                        gameEl.appendChild(acceptWindow);

                        acceptBtn.onclick = () => {
                            if(item.itemId.category === 'colors') {
                                messageEl('אין באפשרותך להשליך פריט זה.', 0);
                                return acceptWindow.remove();
                            }
                            socket.emit('dropItem', item._id);
                            document.querySelector(`[data-item="${ item._id }"]`).remove();
                            acceptWindow.remove();
                        }

                        cancelBtn.onclick = () => acceptWindow.remove();
                    } else {                 
                        socket.emit('putItem', item._id);

                        for(let i = 0; i < categoriesArray.length; i++) {
                            if(item.itemId.category == categoriesArray[i]) {
                                if(userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).getAttribute('data-item')?.toString() == item.itemId._id.toString()) {
                                    if(categoriesArray[i] !== 'colors')
                                        userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).querySelector('img').removeAttribute('src');
                                        userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).removeAttribute('data-item');
                                } else {
                                    userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).querySelector('img').src = itemsPath + item.itemId.itemImage;
                                    userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).setAttribute('data-item', item.itemId._id);
                                    userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).style.top = !item.itemId.position.y ? null : item.itemId.position.y + 'px';
                                    userDisplay.querySelector(`.${ Object.keys(users[socket.id].clothes)[i] }`).style.left = !item.itemId.position.x ? null : item.itemId.position.x + 'px';
                                }
                            }
                        }
                    }
                });
            });
        });
    }

    div.appendChild(categories);
    div.appendChild(closeBtn);
    div.appendChild(displayUser);
    div.appendChild(moneyText);
    div.appendChild(itemsEl);

    gameEl.appendChild(div);

    getCategoriesItems('colors');

    // Get authenticated user data
    fetch(`${ beginUrl }/users/authuser`, {
        method: 'GET',
        headers: {
            'auth-token': token
        }
    })
    .then(res => res.json())
    .then(({ displayedUsername, money }) => {
        usernameText.textContent = displayedUsername;
        moneyText.textContent = money;
    });

    closeBtn.addEventListener('click', () => {
        gameEl.removeChild(div);
    });
}

// Function that create user card
function getUserCard(id) {
    if(id === socket.id) return;

    const gameEl = document.querySelector('.game');

    if(gameEl.contains(document.querySelector('.close-btn'))) return;

    const username = users[id].username;

    const userCardEl = document.createElement('div');
    userCardEl.classList.add('user-card');

    const closeBtn = document.createElement('img');
    closeBtn.classList.add('close-btn');
    closeBtn.src = '../assets/userCard/closeBtn.png';

    const userUsername = document.createElement('h3');
    userUsername.textContent = username;

    const userDisplayContainer = document.createElement('div');
    userDisplayContainer.classList.add('user');

    const userDisplay = getUserDisplay(id, 1.2);
    userDisplayContainer.appendChild(userDisplay);

    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('events-container');

    const tradeBtn = document.createElement('img');
    tradeBtn.src = '../assets/userCard/tradeBtn.png';

    const homeButton = document.createElement('img');
    homeButton.src = '../assets/userCard/homeBtn.png';

    eventsContainer.appendChild(tradeBtn);
    eventsContainer.appendChild(homeButton);

    userCardEl.appendChild(closeBtn);
    userCardEl.appendChild(userUsername);
    userCardEl.appendChild(userDisplayContainer);
    userCardEl.appendChild(eventsContainer);
    gameEl.appendChild(userCardEl);

    closeBtn.addEventListener('click', () => {
        userCardEl.remove();
    });

    tradeBtn.addEventListener('click', () => {
        socket.emit('inviteToTrade', id);
    });
}

function tradeEl(inviteObj) {
    const gameEl = document.querySelector('.game');

    const trade = document.createElement('div');
    trade.classList.add('trade');

    const tradeBackground = document.createElement('div');
    tradeBackground.classList.add('trade_background');

    const inventory = document.createElement('div');
    inventory.classList.add('inventory_trade');

    const categories = document.createElement('div');
    categories.classList.add('categories_trade');

    const itemsEl = document.createElement('div');
    itemsEl.classList.add('items_trade');

    inventory.appendChild(categories);
    inventory.appendChild(itemsEl);

    const tradeSection = document.createElement('div');
    tradeSection.classList.add('trade_section');

    const tradeArea = document.createElement('div');
    tradeArea.classList.add('trade_area');

    const myTradeArea = document.createElement('div');
    myTradeArea.classList.add('my_trade_area')

    for(let i = 0; i < 9; i++) {
        const tradeBox = document.createElement('div');
        tradeBox.classList.add('trade_box');
        myTradeArea.appendChild(tradeBox);
    }

    tradeArea.appendChild(myTradeArea);

    const tradeButtons = document.createElement('div');
    tradeButtons.classList.add('trade_buttons');

    const acceptTradeBtn = document.createElement('button');
    acceptTradeBtn.textContent = 'אשר';

    acceptTradeBtn.onclick = () => socket.emit('openAcceptWindow', inviteObj.id);

    const closeTradeBtn = document.createElement('button');
    closeTradeBtn.textContent = 'בטל';

    closeTradeBtn.onclick = () => socket.emit('closeTrade', inviteObj.id);

    tradeButtons.appendChild(acceptTradeBtn);
    tradeButtons.appendChild(closeTradeBtn);
    tradeArea.appendChild(tradeButtons);

    const opponentTradeArea = document.createElement('div');
    opponentTradeArea.classList.add('opponent_trade_area')

    for(let i = 0; i < 9; i++) {
        const opponentTradeBox = document.createElement('div');
        opponentTradeBox.classList.add('trade_box');
        opponentTradeArea.appendChild(opponentTradeBox);
    }

    tradeArea.appendChild(opponentTradeArea);

    for(let i = 0; i < categoriesArray.length; i++) {
        const category = document.createElement('span');
        category.classList.add('category');
        category.setAttribute('data-category', categoriesArray[i]);

        const categoryImage = document.createElement('img');
        categoryImage.src = `../assets/categories/${ i }.png`;

        category.appendChild(categoryImage);
        categories.appendChild(category);

        category.addEventListener('click', async () => {
            const items = await getCategoriesItems(category.getAttribute('data-category'));

            itemsEl.innerHTML = '';

            items.forEach(item => {
                const itemBox = document.createElement('div');
                itemBox.classList.add('item');
                itemBox.setAttribute('data-item', item._id);

                const itemImage = document.createElement('img');
                itemImage.src = itemsPath + item.itemId.itemImage;

                itemBox.appendChild(itemImage);
                itemsEl.appendChild(itemBox);

                itemBox.addEventListener('click', () => {
                    if(item.itemId.category === 'colors') return messageEl('אין באפשרותך להחליף פריט זה.', 0);
                    socket.emit('addItemToTrade', { tradeID: inviteObj.id, itemID: item._id });
                });
            });
        });
    }

    tradeSection.appendChild(tradeArea);

    tradeBackground.appendChild(inventory);
    tradeBackground.appendChild(tradeSection);

    trade.appendChild(tradeBackground);
    gameEl.appendChild(trade);
}

const acceptWindowTrade = tradeID => {
    const tradeBackground = document.querySelector('.game .trade .trade_background');
    const acceptWindow = document.createElement('div');
    acceptWindow.classList.add('accept-window');
    
    const acceptWindowMessage = document.createElement('p');
    acceptWindowMessage.textContent = 'האם ברצונך לאשר את ההחלפה?';

    const acceptWindowButtons = document.createElement('div');
    acceptWindowButtons.classList.add('window_buttons');
    
    const acceptWindowBtn = document.createElement('button');
    acceptWindowBtn.textContent = 'אשר החלפה';

    acceptWindowBtn.onclick = () => socket.emit('acceptTrade', tradeID);

    const cancelWindowBtn = document.createElement('button');
    cancelWindowBtn.textContent = 'בטל החלפה';

    cancelWindowBtn.onclick = () => socket.emit('closeTrade', tradeID);

    acceptWindowButtons.appendChild(acceptWindowBtn);
    acceptWindowButtons.appendChild(cancelWindowBtn);

    acceptWindow.appendChild(acceptWindowMessage);
    acceptWindow.appendChild(acceptWindowButtons);
    tradeBackground.appendChild(acceptWindow);
}

// Creating the login screen elements
function loginEl() {
    const div = document.createElement('div');
    div.classList.add('login');

    const h1Title = document.createElement('h1');
    h1Title.textContent = 'התחברות';

    const loginForm = document.createElement('form');
    loginForm.classList.add('login-form');

    const loginUsernameInput = document.createElement('input');
    loginUsernameInput.classList.add('username-input');
    loginUsernameInput.placeholder = 'שם משתמש';
    loginUsernameInput.type = 'text';

    loginUsernameInput.addEventListener('input', e => username = e.target.value);

    const loginPasswordInput = document.createElement('input');
    loginPasswordInput.classList.add('password-input');
    loginPasswordInput.placeholder = 'סיסמה';
    loginPasswordInput.type = 'password';

    loginPasswordInput.addEventListener('input', e => password = e.target.value);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'התחבר';
    submitBtn.type = 'submit';

    loginForm.appendChild(loginUsernameInput);
    loginForm.appendChild(loginPasswordInput);
    loginForm.appendChild(submitBtn);

    const h3Text = document.createElement('h3');
    h3Text.classList.add('not-registered');
    h3Text.textContent = 'עוד לא רשום?';
    
    const transferToRegisterBtn = document.createElement('button');
    transferToRegisterBtn.textContent = 'הרשמה';

    h3Text.appendChild(transferToRegisterBtn);

    div.appendChild(h1Title);
    div.appendChild(loginForm);
    div.appendChild(h3Text);

    containerEl.appendChild(div);

    loginForm.addEventListener('submit', e => {
        e.preventDefault();

        socket.emit('createUser', username, password);

        socket.on('loginSuccessful', tokenX => {
            token = tokenX;
            transferToAnotherPage(null, div, gameEl);
        });
    });

    transferToAnotherPage(transferToRegisterBtn, div, registerEl);
}

function getUserDisplay(id, displaySize = 1) {
    if(!users[id]) return;

    const userClothes = users[id].clothes;

    const userDisplay = document.createElement('div');
    userDisplay.classList.add('user-display');
    userDisplay.style.transform = `scale(${ displaySize && displaySize })`;

    for(let i = 0; i < Object.keys(userClothes).length; i++) {
        if(Object.values(userClothes)[i]) {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('image-container');
            const itemImage = document.createElement('img');
            imageContainer.classList.add(Object.keys(userClothes)[i]);
            imageContainer.setAttribute('data-item', Object.values(userClothes)[i]._id);
            itemImage.src = itemsPath + Object.values(userClothes)[i].itemImage;
            imageContainer.style.position = 'absolute';
            imageContainer.style.top = !Object.values(userClothes)[i].position.y ? null : Object.values(userClothes)[i].position.y + 'px';
            imageContainer.style.left = !Object.values(userClothes)[i].position.y ? null : Object.values(userClothes)[i].position.x + 'px';
            imageContainer.appendChild(itemImage);
            userDisplay.appendChild(imageContainer);
        } else {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('image-container');
            const itemImage = document.createElement('img');
            imageContainer.classList.add(Object.keys(userClothes)[i]);
            imageContainer.style.position = 'absolute';
            imageContainer.appendChild(itemImage);
            userDisplay.appendChild(imageContainer);
        }
    }

    return userDisplay;
}

// Creating the register screen elements
function registerEl() {
    const div = document.createElement('div');
    div.classList.add('register');

    const h1Title = document.createElement('h1');
    h1Title.textContent = 'הרשמה';

    const registerForm = document.createElement('form');
    registerForm.classList.add('register-form');

    const registerUsernameInput = document.createElement('input');
    registerUsernameInput.classList.add('.username-input');
    registerUsernameInput.placeholder = 'שם משתמש';

    registerUsernameInput.addEventListener('input', e => username = e.target.value);

    const registerEmailInput = document.createElement('input');
    registerEmailInput.classList.add('.username-input');
    registerEmailInput.placeholder = 'אימייל';

    registerEmailInput.addEventListener('input', e => email = e.target.value);

    const registerPasswordInput = document.createElement('input');
    registerPasswordInput.classList.add('.password-input');
    registerPasswordInput.placeholder = 'סיסמה';
    registerPasswordInput.type = 'password';

    registerPasswordInput.addEventListener('input', e => password = e.target.value);

    const registerConfirmPasswordInput = document.createElement('input');
    registerConfirmPasswordInput.classList.add('.password-input');
    registerConfirmPasswordInput.placeholder = 'הקלד סיסמה שנית';
    registerConfirmPasswordInput.type = 'password';

    registerConfirmPasswordInput.addEventListener('input', e => confirmPassword = e.target.value);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'הרשם';
    submitBtn.type = 'submit';

    registerForm.appendChild(registerUsernameInput);
    registerForm.appendChild(registerEmailInput);
    registerForm.appendChild(registerPasswordInput);
    registerForm.appendChild(registerConfirmPasswordInput);
    registerForm.appendChild(submitBtn);

    registerForm.addEventListener('submit', e => {
        e.preventDefault();

        fetch(`${ beginUrl }/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                confirmPassword
            })
        })
        .then(res => res.json())
        .then(data => { 
            if(data.message === 'המשתמש נוצר בהצלחה!') {
                    transferToAnotherPage(null, div, loginEl);
                    messageEl(data.message, 1);
            } else {
                messageEl(data.message, 2);
            }
         });
    });
    
    const h3Text = document.createElement('h3');
    h3Text.classList.add('already-registered');
    h3Text.textContent = 'כבר רשום?';
    
    const transferToLoginBtn = document.createElement('button');
    transferToLoginBtn.textContent = 'התחברות';

    h3Text.appendChild(transferToLoginBtn);

    div.appendChild(h1Title);
    div.appendChild(registerForm);
    div.appendChild(h3Text);

    containerEl.appendChild(div);

    transferToAnotherPage(transferToLoginBtn, div, loginEl);
}

// Creating the loading El screen
function loadingEl() {
    const div = document.createElement('div');
    div.classList.add('loading');

    const loadingImg = document.createElement('img');
    loadingImg.classList.add('loading');
    loadingImg.src = './assets/loading.gif';

    div.appendChild(loadingImg);

    containerEl.appendChild(div);
}

function createPrizeEl(id, position) {
    const gameBackground = document.querySelector('.game .game-background');

    const prizeEl = document.createElement('img');
    prizeEl.classList.add('prize');
    prizeEl.setAttribute('data-prize', id);
    prizeEl.src = './assets/chest.png';
    prizeEl.style.position = 'absolute';
    prizeEl.style.left = `${ position.x }px`;
    prizeEl.style.top = `${ position.y }px`;
    prizeEl.style.zIndex = position.y;
    prizeEl.style.cursor = 'pointer';

    gameBackground.appendChild(prizeEl);

    prizeEl.addEventListener('click', () => socket.emit('prizeCollect', id));
}

function createDropEl(id, position) {
    const drops = document.querySelector('.game .game-background .drops');
    const dropImageEl = document.createElement('img');

    dropImageEl.src = '/rooms/drop.png';
    dropImageEl.setAttribute('data-drop', id);

    dropImageEl.style.position = 'absolute';
    dropImageEl.style.width = '50px';
    dropImageEl.style.height = '45px';
    dropImageEl.style.top = `${ position.y }px`;
    dropImageEl.style.left = `${ position.x }px`;
    dropImageEl.style.zIndex = position.y;
    dropImageEl.style.transform = 'translate(-50%, -50%)';
    dropImageEl.style.cursor = 'pointer';

    dropImageEl.addEventListener('click', () => socket.emit('dropCollect', id));

    drops.appendChild(dropImageEl);
}

// Get the items of the current user in the inventory by category
async function getCategoriesItems(category) {
    return await fetch(`${ beginUrl }/useritems/${ category }`, {
        method: 'GET',
        headers: {
            'auth-token': token
        }
    })
    .then(res => res.json())
    .then(async ({ items }) => (items))
    .catch(err => console.error(err));
}

// Function that transfer between "pages" without to refresh
function transferToAnotherPage(transferBtn, currentEl, newEl) {
    if(transferBtn === null) {
        containerEl.removeChild(currentEl);
        newEl();
    } else {
        transferBtn.onclick = () => {
            containerEl.removeChild(currentEl);
            newEl();
        }
    }
}

// Open the error box and display error message
function messageEl(msg, type, sendedBy) {
    const div = document.createElement('div');
    div.classList.add('message-box');

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close-btn');

    switch(type) {
        case 0:
            const sendBySystem = document.createElement('h3');
            sendBySystem.classList.add('sended_by');
            sendBySystem.textContent = `הודעת מערכת`;
            div.style.backgroundImage = 'url("../assets/message/system.png")';
            closeBtn.style.backgroundImage = 'url("../assets/message/system-btn.png")';
            div.appendChild(sendBySystem);
            break;
        case 1:
            div.style.backgroundImage = 'url("../assets/message/success.png")';
            closeBtn.style.backgroundImage = 'url("../assets/message/success-btn.png")';
            break;
        case 2:
            div.style.backgroundImage = 'url("../assets/message/failed.png")';
            closeBtn.style.backgroundImage = 'url("../assets/message/failed-btn.png")';
            break;
        case 3:
            const sendByUser = document.createElement('h3');
            sendByUser.classList.add('sended_by');
            sendByUser.textContent = `נשלח על ידי ${ sendedBy }`;
            div.style.backgroundImage = 'url("../assets/message/admin.png")';
            closeBtn.style.backgroundImage = 'url("../assets/message/admin-btn.png")';
            div.appendChild(sendByUser);
    }

    const text = document.createElement('h1');

    div.appendChild(closeBtn);
    div.appendChild(text);

    text.textContent = msg;

    containerEl.appendChild(div);

    // Close error box
    closeBtn.addEventListener('click', () => {
        if(closeBtn !== null) {
            containerEl.removeChild(div);
        }
    });
}

async function shopEl(shopId) {
    const gameEl = document.querySelector('.game');

    const shop = document.createElement('div');
    shop.classList.add('shop');

    if(gameEl.contains(shop)) return;

    const shopBackground = document.createElement('div');
    shopBackground.classList.add('shop_background');

    const closeBtn = document.createElement('h3');
    closeBtn.classList.add('close_btn');
    closeBtn.textContent = 'x';

    closeBtn.addEventListener('click', () => shop.remove());

    shopBackground.appendChild(closeBtn);
    shop.appendChild(shopBackground);
    gameEl.appendChild(shop);

    const shopResponse = await getShopItems(shopId);

    const shopName = document.createElement('h1');
    shopName.classList.add('shop_name');
    shopName.textContent = shopResponse.shopName;

    shopBackground.appendChild(shopName);

    const itemsEl = document.createElement('div');
    itemsEl.classList.add('items');

    if(!shopResponse.items.length) {
        const noItems = document.createElement('h3');
        noItems.textContent = 'אין פריטים בחנות זו';
        shopBackground.appendChild(noItems);
    } else {
        shopResponse.items.forEach(item => {
            const itemBox = document.createElement('div');
            itemBox.classList.add('item_box');

            const itemImage = document.createElement('img');
            itemImage.src = itemsPath + item.itemId.itemImage;
            itemImage.style.width = '65px';

            const itemDetails = document.createElement('div');
            itemDetails.classList.add('item_details');

            const itemName = document.createElement('p');
            itemName.textContent = item.itemId.itemName;

            const itemPrice = document.createElement('h3');
            itemPrice.textContent = 'מחיר: ' + item.price;

            const buyBtn = document.createElement('button');
            buyBtn.classList.add('buy_btn');
            buyBtn.textContent = 'קנה פריט';

            buyBtn.addEventListener('click', () => {
                fetch(`${beginUrl}/shops/buy/${ item._id }`, {
                    method: 'POST',
                    headers: {
                        'auth-token': token
                    }
                })
                .then(res => res.json())
                .then(data => {
                    if(data.message) 
                        messageEl(data.message, 1);
                    if(data.error) 
                        messageEl(data.error, 2);
                });
            });

            itemBox.appendChild(itemImage);
            itemDetails.appendChild(itemName);
            itemDetails.appendChild(itemPrice);
            itemBox.appendChild(itemDetails);
            itemBox.appendChild(buyBtn);
            itemsEl.appendChild(itemBox);
        });

        shopBackground.appendChild(itemsEl);
    }
}

async function getShopItems(shopId) {
    return await fetch(`${ beginUrl }/shops/shop/${ shopId }`, {
        headers: {
            'auth-token': token
        }
    })
    .then(res => res.json())
    .then(data => (data))
    .catch(err => console.error(err));
}