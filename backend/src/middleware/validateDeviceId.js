const { validate: validateUUID } = require("uuid");

const validateDeviceId = (req, res, next) => {
    const { device_id } = req.params;

    if (!device_id || !validateUUID(device_id)) {
        return res.status(400).json({
            message: "Invalid device_id (must be UUID)"
        });
    }

    next();
};

module.exports = validateDeviceId;