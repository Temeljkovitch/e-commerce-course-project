const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please, provide a name!"],
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, "Please, provide an email!"],
    validate: {
      validator: validator.isEmail,
      message: "Please, provide a valid email!",
    },
    unique: true,
    // match: [
    //   /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    //   "Please, provide a valid email!",
    // ],
  },
  password: {
    type: String,
    required: [true, "Please, provide a password!"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
});

UserSchema.pre("save", async function () {
  // if (!this.isModified("password")) return;
  // Hashing password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // the "this" keyword points to the user
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    { userId: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

UserSchema.methods.attachCookiesToResponse = function (response) {
  const token = this.createJWT();
  console.log(token);
  response.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};

UserSchema.methods.comparePassword = function (possiblePassword) {
  return bcrypt.compare(possiblePassword, this.password);
};

UserSchema.methods.createTokenUser = function () {
  const tokenUser = { userId: this._id, name: this.name, role: this.role };
  return tokenUser;
};

module.exports = mongoose.model("User", UserSchema);
