const UserItems = require('../models/UserItems');
const Users = require('../models/users');

module.exports = {
    getUserCategoryItems: async (req, res) => {
        const { category } = req.params;

        UserItems.find({ userId: req.user._id }).populate('itemId')
        .then(userItems => {
            const items = userItems.filter(({ itemId }) => {
                return itemId?.category === category;
            });

            res.status(200).json({ items });
        })
        .catch(err => console.error(err));
    },
    giveItem: async (req, res) => {
        const { user, item } = req.body;
        const { _id } = req.user;

        const { isAdmin } = await Users.findById(_id);

        if(!isAdmin) return res.status(400).json({ message: 'ניסיון יפה :)' });

        const userId = await Users.findOne({ username: user.toLowerCase() });

        const newUserItem = new UserItems({
            userId: userId._id,
            itemId: item
        });

        await newUserItem.save()
        .then(() => res.status(200).json({ message: 'הפריט נשלח בהצלחה!' }));
    }
}