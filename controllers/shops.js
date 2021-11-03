const Shops = require('../models/Shops');
const ItemsOnShops = require('../models/ItemOnShops');
const Users = require('../models/users');
const UserItems = require('../models/UserItems');

module.exports = {
    getShop: async (req, res) => {
        const { shopId } = req.params;

        if(!shopId) return;

        Shops.findById(shopId)
        .then(shop => {
            ItemsOnShops.find({ shopId }).populate('itemId')
            .then(shopItems => {
                console.log(shopItems);
                res.status(200).json({
                    shopName: shop.shopName,
                    items: shopItems
                });
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    },
    buyItem: async (req, res) => {
        const { _id } = req.user; 
        const { shopItemId } = req.params;

        const { money } = await Users.findById(_id);
        
        ItemsOnShops.findById(shopItemId)
        .then(async itemOnShop => {
            if(money >= itemOnShop.price) {
                const newUserItem = new UserItems({
                    userId: _id,
                    itemId: itemOnShop.itemId
                });
        
                await newUserItem.save()
                .then(() => {
                    Users.findByIdAndUpdate(_id, { $inc: { money: -itemOnShop.price } })
                    .then(() => res.status(200).json({ message: 'הפריט נרכש בהצלחה!' }))
                    .catch(err => console.error(err));
                });
            } else {
                res.status(400).json({ error: 'אין לך מספיק מטבעות.' });
            }
        })
        .catch(err => console.error(err));
    }
}