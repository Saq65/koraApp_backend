const express = require('express');
const {
    getSavedAddresses,
    createSavedAddress,
    updateSavedAddress,
    deleteSavedAddress
} = require('../controllers/savedAddressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getSavedAddresses)
    .post(createSavedAddress);

router.route('/:id')
    .put(updateSavedAddress)
    .delete(deleteSavedAddress);

module.exports = router;