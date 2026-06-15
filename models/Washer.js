const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const WasherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    expoPushToken: { type: String, default: null },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

WasherSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

module.exports = mongoose.model("Washer", WasherSchema);