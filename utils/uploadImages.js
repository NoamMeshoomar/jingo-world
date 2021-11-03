const path = require('path');
const multer = require('multer');
const shortid = require('shortid');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./items/${ req.params.category }`);
    },
    filename: function (req, file, cb) {
        cb(null, 'item' + '-' + shortid.generate() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if(path.extname(file.originalname) !== '.png' || path.extname(file.originalname) !== '.gif') {
        cb(null, false);
    }

    cb(null, true);
}

const upload = multer({ storage, fileFilter });

module.exports = upload;