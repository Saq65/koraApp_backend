const SavedAddress = require('../models/SavedAddress');

// Helper: get user ID from authenticated request
const getUserId = (req) => req.user.id;   // ensure your JWT contains `id`

// @desc    Get all saved addresses for the logged-in user
// @route   GET /api/saved-addresses
// @access  Private
const getSavedAddresses = async (req, res) => {
    try {
        const addresses = await SavedAddress.find({ userId: getUserId(req) })
            .sort({ isDefault: -1, createdAt: -1 });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching addresses', error: error.message });
    }
};

// @desc    Create a new saved address
// @route   POST /api/saved-addresses
// @access  Private
const createSavedAddress = async (req, res) => {
    try {
        const { label, customLabel, address, coordinates, isDefault } = req.body;
        const newAddress = new SavedAddress({
            userId: getUserId(req),
            label,
            customLabel: label === 'other' ? customLabel : null,
            address,
            coordinates,
            isDefault: isDefault || false
        });
        await newAddress.save();
        res.status(201).json(newAddress);
    } catch (error) {
        res.status(400).json({ message: 'Error creating address', error: error.message });
    }
};

// @desc    Update an existing address
// @route   PUT /api/saved-addresses/:id
// @access  Private
const updateSavedAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await SavedAddress.findOneAndUpdate(
            { _id: id, userId: getUserId(req) },
            updates,
            { new: true, runValidators: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Error updating address', error: error.message });
    }
};

// @desc    Delete an address
// @route   DELETE /api/saved-addresses/:id
// @access  Private
const deleteSavedAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await SavedAddress.findOneAndDelete({ _id: id, userId: getUserId(req) });
        if (!deleted) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting address', error: error.message });
    }
};

module.exports = {
    getSavedAddresses,
    createSavedAddress,
    updateSavedAddress,
    deleteSavedAddress
};