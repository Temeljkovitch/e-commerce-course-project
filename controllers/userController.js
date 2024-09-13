const User = require("../models/User");
const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
  ForbiddenError,
} = require("../errors");
const { StatusCodes } = require("http-status-codes");
const {
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
} = require("../utils/jwt");

const getAllUsers = async (request, response) => {
  const users = await User.find({}).select("-password");

  response.status(StatusCodes.OK).json({ users, nbHits: users.length });
};

const getSingleUser = async (request, response) => {
  const { id } = request.params;

  const user = await User.findOne({ _id: id }).select("-password");
  if (!user) {
    throw new NotFoundError(`No user found with id: ${id}`);
  }

  checkPermissions(request.user, user._id);

  response.status(StatusCodes.OK).json({ user });
};

const showCurrentUser = async (request, response) => {
  const user = request.user;
  response.status(StatusCodes.OK).json({ user });
};

const updateUser = async (request, response) => {
  const { name, email } = request.body;
  if (!name || !email) {
    throw new BadRequestError("Please, fill in all fields!");
  }
  const user = await User.findOneAndUpdate(
    { _id: request.user.userId },
    request.body,
    {
      new: true,
      runValidators: true,
    }
  );
  user.attachCookiesToResponse(response);
  response.status(StatusCodes.OK).json({ user: user.createTokenUser() });

  // const user = await User.findOne({ _id: request.user.userId });
  // user.name = name;
  // user.email = email;
  // await user.save();

  // attachCookiesToResponse(response, user);
  // response.status(StatusCodes.OK).json({ user: createTokenUser(user) });
};

const updateUserPassword = async (request, response) => {
  const { password, newPassword } = request.body;
  if (!password || !newPassword) {
    throw new BadRequestError("Please, fill in all fields!");
  }
  const user = await User.findOne({ _id: request.user.userId });
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError(
      "Invalid Credentials! Check your password and try again."
    );
  }
  // const isNewPasswordEqual = await user.comparePassword(newPassword);
  // if (isNewPasswordEqual) {
  //   throw new UnauthenticatedError(
  //     "The password is the same as the old one!"
  //   )
  // }
  user.password = newPassword;
  await user.save();
  response.status(StatusCodes.OK).json({ msg: "Password updated!" });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
