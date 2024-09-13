const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { UnauthenticatedError, BadRequestError } = require("../errors");
const { attachCookiesToResponse, createTokenUser } = require("../utils/jwt");

const login = async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    throw new BadRequestError("Please, fill in all fields!");
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    throw new UnauthenticatedError(
      "Invalid Credentials! Email not registered in our database."
    );
  }

  // Checking password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(
      "Invalid Credentials! Check your password and try again."
    );
  }

  attachCookiesToResponse(response, createTokenUser(user));

  response.status(StatusCodes.OK).json({ user: createTokenUser(user) });
};

const logout = async (request, response) => {
  response.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  response.status(StatusCodes.OK).json({ msg: "user logged out" });
};

const register = async (request, response) => {
  const { name, email, password } = request.body;

  // Checking for duplicate email
  const checkEmail = await User.findOne({ email: email });
  if (checkEmail) {
    throw new BadRequestError("Email already registered!");
  }

  // Creating the first user as admin
  const isFirstUser = (await User.countDocuments({})) === 0;
  const role = isFirstUser ? "admin" : "user";

  const user = await User.create({ name, email, password, role });

  // Creating token and attaching it to cookies
  user.attachCookiesToResponse(response); // Using method from User model

  response.status(StatusCodes.CREATED).json({ user: user.createTokenUser() });
};

module.exports = { login, logout, register };
