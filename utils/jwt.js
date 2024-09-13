const jwt = require("jsonwebtoken");
const { ForbiddenError } = require("../errors");

const createJWT = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = (response, user) => {
  const token = createJWT(user);
  response.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};

const createTokenUser = (user) => {
  const tokenUser = { userId: user._id, name: user.name, role: user.role };
  return tokenUser;
};

const checkPermissions = (requestUser, resourceUserId) => {
  if (requestUser.role === "admin") return;
  if (requestUser.userId === resourceUserId.toString()) return;
  throw new ForbiddenError("Not authorized to acess this route!");
};

module.exports = {
  createJWT,
  verifyToken,
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
};
