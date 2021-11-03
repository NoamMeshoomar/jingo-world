const bcrypt = require('bcryptjs');

const Users = require('../models/users');
const UserItems = require('../models/UserItems');
const ItemsOnUser = require('../models/ItemsOnUser');

const validateEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports = {
    getCurrentUser: (req, res) => {
        const { id } = req.params;

        Users.findById(id, 'displayedUsername')
        .then(user => console.log(user))
        .catch(err => res.status(400).json({ err }));
    },
    register: async (req, res) => {
        const { username, email, password, confirmPassword } = req.body;

        const usernameExist = await Users.findOne({ username: username.toLowerCase() });
        const emailExist = await Users.findOne({ email: email.toLowerCase() });

        // Check if User with Username already exist
        if(usernameExist) return res.status(400).json({
            message: 'שם משתמש קיים או לא חוקי'
        });

        // Check if User with Email already exist
        if(emailExist) return res.status(400).json({
            message: 'אימייל קיים או לא חוקי'
        });

        // Check if username is not empty
        if(username.length === 0) return res.status(400).json({
            message: 'שם משתמש לא יכול להיות ריק'
        });

        // Check if username is alphanumeric
        if(!username.match(/^[0-9a-zA-Zא-ת]+$/)) return res.status(400).json({
            message: 'שם משתמש יכול לכלול רק אותיות ומספרים'
        });

        // Check if username is 4-15 characters
        if(username.length < 3 || username.length > 10) return res.status(400).json({
            message: 'שם משתמש חייב להיות 3-10 תווים'
        });

        // Validate the email format
        if(!validateEmail(email)) return res.status(400).json({
            message: 'נא הקלד כתובת אימייל חוקית'
        });
        
        // Check if password is not empty
        if(password.length === 0) return res.status(400).json({
            message: 'סיסמה לא יכולה להיות ריקה'
        });

        // Check if password length is 5-35 characters
        if(password.length < 5 || username.length > 35) return res.status(400).json({
            message: 'סיסמה חייבת להיות 5-35 תווים'
        });

        // Check is password and confirmPassowrd is match
        if(password !== confirmPassword) return res.status(400).json({
            message: 'סיסמאות חייבות להיות תואמות'
        });

        const DEFAULT_COLOR = '611a15eacd4f931c7b0464a8';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new Users({
            username: username.toLowerCase(),
            displayedUsername: username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const { _id } = await newUser.save()

        const newItemsOnUser = new ItemsOnUser({ 
            userId: _id,
            color: DEFAULT_COLOR
        });

        await newItemsOnUser.save()
        .then(() => {
            new UserItems({
                userId: _id,
                itemId: DEFAULT_COLOR
            }).save().catch(console.error);
        });

        res.status(200).json({ message: 'המשתמש נוצר בהצלחה!' });
    },
    authUser: async (req, res) => {
        Users.findById(req.user._id, 'displayedUsername money isAdmin').then(user => {
            res.status(200).json(user);
        });
    },
    ban: async (req, res) => {
        const { user } = req.body;

        if(user === '' || user === null) return;

        const { isAdmin } = await Users.findById(req.user._id);

        if(isAdmin) {
            Users.findOne({ username: user.toLowerCase() }, async (err, doc) => {
                doc.isBanned = !doc.isBanned;

                await doc.save();

                if(doc.isBanned) {
                    return res.status(200).json({ message: 'השתמש הורחק.' });
                } else if(!doc.isBanned) {
                    res.status(200).json({ message: 'ההרחקה ירדה.' });
                }
            });
        } else {
            return res.status(400).json({ message: 'נסיון יפה :)' });
        }
    },
    mute: async (req, res) => {
        const { user } = req.body;

        if(user === '' || user === null) return;

        const { isAdmin } = await Users.findById(req.user._id);

        if(isAdmin) {
            Users.findOne({ username: user.toLowerCase() }, async (err, doc) => {
                doc.isMuted = !doc.isMuted;

                await doc.save();

                if(doc.isMuted) {
                    return res.status(200).json({ message: 'המשתמש הושתק.' });
                } else if(!doc.isMuted) {
                    res.status(200).json({ message: 'ההשתקה ירדה.' });
                }
            });
        } else {
            return res.status(400).json({ message: 'נסיון יפה :)' });
        }
    }
}