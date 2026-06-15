const Customer = require('../models/Customer');
const Account = require('../models/Account'); // ← needed to update email
const bcrypt = require('bcrypt');
// ─── Helpers ────────────────────────────────────────────────────────────────
const ok   = (res, data, code = 200) => res.status(code).json({ success: true,  data });
const fail = (res, msg,  code = 500) => res.status(code).json({ success: false, message: msg });

// ─── GET /api/customers/profile ─────────────────────────────────────────────
// Returns the customer profile for the logged-in user.
// req.user is set by the protect middleware: { id: accountId, role }
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      accountId: req.user.id,
    }).populate({
      path: "accountId",
      select: "mobile email role",    // username removed, email added
    });

    if (!customer) {
      return fail(res, "Profile not found", 404);
    }

    return ok(res, {
      _id: customer._id,
      fullName: customer.fullName,
      dob: customer.dob,
      profilePhoto: customer.profilePhoto,
      addresses: customer.addresses,
      defaultAddressId: customer.defaultAddressId,
      phone: customer.phone,          // if you keep it on Customer

      // from Account table (email now comes from Account)
      mobile: customer.accountId?.mobile,
      email: customer.accountId?.email,   // ← email from Account
      role: customer.accountId?.role,
    });
  } catch (err) {
    return fail(res, err.message);
  }
};

// ─── PUT /api/customers/profile ─────────────────────────────────────────────
// Update basic profile fields: fullName, dob, phone, profilePhoto
// Email is NOT updated here – use a separate endpoint for email changes.
exports.updateProfile = async (req, res) => {
  try {
    // Removed 'email' – email belongs to Account, not Customer
    const allowed = ['fullName', 'dob', 'phone', 'profilePhoto'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const customer = await Customer.findOneAndUpdate(
      { accountId: req.user.id },
      { $set: updates },
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    if (!customer) return fail(res, 'Profile not found', 404);
    return ok(res, customer);
  } catch (err) {
    return fail(res, err.message);
  }
};

// (Optional) Separate endpoint to update email (if needed)
// PUT /api/customers/email
exports.updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      return fail(res, 'New email and current password are required', 400);
    }

    // 1. Get account and verify password
    const account = await Account.findById(req.user.id);
    if (!account) return fail(res, 'Account not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) return fail(res, 'Current password is incorrect', 401);

    // 2. Check if new email already in use
    const existing = await Account.findOne({ email: newEmail.toLowerCase() });
    if (existing) return fail(res, 'Email already registered', 409);

    // 3. Update email
    account.email = newEmail.toLowerCase();
    await account.save();

    // 4. (Optional) Send OTP to new email to verify? Actually best practice is to verify first.
    // For full security, you should first send an OTP to the new email, then confirm.
    // But this simplified version updates immediately after password check.

    return ok(res, { email: account.email });
  } catch (err) {
    return fail(res, err.message);
  }
};

// ─── POST /api/customers/addresses ──────────────────────────────────────────
// Add a new address. Body: { label, addressLine, city, pincode, coordinates }
exports.addAddress = async (req, res) => {
  try {
    const { label, addressLine, city, pincode, coordinates } = req.body;

    if (!addressLine || !city) {
      return fail(res, 'addressLine and city are required', 400);
    }

    const customer = await Customer.findOne({ accountId: req.user.id });
    if (!customer) return fail(res, 'Profile not found', 404);

    customer.addresses.push({ label, addressLine, city, pincode, coordinates });

    // If this is the first address, auto-set as default
    if (customer.addresses.length === 1) {
      customer.defaultAddressId = customer.addresses[0]._id;
    }

    await customer.save();
    return ok(res, customer.addresses, 201);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ─── PUT /api/customers/addresses/:addressId ────────────────────────────────
// Edit an existing address.
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, addressLine, city, pincode, coordinates } = req.body;

    const customer = await Customer.findOne({ accountId: req.user.id });
    if (!customer) return fail(res, 'Profile not found', 404);

    const addr = customer.addresses.id(addressId);
    if (!addr) return fail(res, 'Address not found', 404);

    if (label       !== undefined) addr.label       = label;
    if (addressLine !== undefined) addr.addressLine = addressLine;
    if (city        !== undefined) addr.city        = city;
    if (pincode     !== undefined) addr.pincode     = pincode;
    if (coordinates !== undefined) addr.coordinates = coordinates;

    await customer.save();
    return ok(res, customer.addresses);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ─── DELETE /api/customers/addresses/:addressId ─────────────────────────────
// Remove an address. If it was default, clear defaultAddressId.
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findOne({ accountId: req.user.id });
    if (!customer) return fail(res, 'Profile not found', 404);

    const addr = customer.addresses.id(addressId);
    if (!addr) return fail(res, 'Address not found', 404);

    addr.deleteOne();

    // If deleted address was the default, clear it
    if (customer.defaultAddressId?.toString() === addressId) {
      customer.defaultAddressId = undefined;
    }

    await customer.save();
    return ok(res, customer.addresses);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ─── PUT /api/customers/addresses/:addressId/default ────────────────────────
// Mark an address as the default delivery address.
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findOne({ accountId: req.user.id });
    if (!customer) return fail(res, 'Profile not found', 404);

    const addr = customer.addresses.id(addressId);
    if (!addr) return fail(res, 'Address not found', 404);

    customer.defaultAddressId = addr._id;
    await customer.save();

    return ok(res, { defaultAddressId: customer.defaultAddressId });
  } catch (err) {
    return fail(res, err.message);
  }
};