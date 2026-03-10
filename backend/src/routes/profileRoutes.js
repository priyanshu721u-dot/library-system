const express = require('express')
const router = express.Router()
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController')
const protect = require('../middleware/authMiddleware')

router.get('/',protect , getProfile);
router.put('/update',protect , updateProfile);
router.put('/change-password',protect , changePassword);

module.exports = router;

