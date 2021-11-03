const beginUrl = '/api/v1';

module.exports = `() => {
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

        fetch(\`${ beginUrl }/users/ban\`, {
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

        fetch(\`${ beginUrl }/users/mute\`, {
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

        fetch(\`${ beginUrl }/useritems/giveitem\`, {
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
}`;