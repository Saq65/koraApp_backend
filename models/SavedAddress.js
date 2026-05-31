const mongoose = require('mongoose');

const savedAddressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    label: {
        type: String,
        required: true,
        enum: ['home', 'office', 'other']
    },
    customLabel: {
        type: String,
        trim: true,
        default: null
    },
    address: {
        type: String,
        required: true
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Pre-save hook to enforce only one default per user
savedAddressSchema.pre('save', async function() {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
});

module.exports = mongoose.model('SavedAddress', savedAddressSchema);