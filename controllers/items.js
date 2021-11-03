const Items = require('../models/Items');
const Users = require('../models/users');

module.exports = {
    uploadItem: async (req, res) => {
        const { itemName, position, category } = req.body;

        const { isAdmin } = await Users.findById(req.user._id);

        if(!isAdmin) return;

        const newItem = new Items({
            itemImage: '/' + category + '/' + req.file.filename,
            itemName,
            position: JSON.parse(position),
            category
        });

        await newItem.save()
        .then(item => res.status(200).json(item));
    }
}