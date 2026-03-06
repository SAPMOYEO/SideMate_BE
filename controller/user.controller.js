const User = require('../model/User');
const userController = {};

userController.createUser = async(req, res) => {
    try {
        const {email, password, nickname, role} = req.body;
        const user = new User({email, password, nickname, role});

        await user.save();

        return res.status(200).json({status: 'success', user});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

userController.getTestUser = async(req, res, next) => {
    try {
        const user = await User.findOne();

        req.userId = user._id;
        next();
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

module.exports = userController;