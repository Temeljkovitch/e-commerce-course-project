const { ForbiddenError, UnauthenticatedError } = require("../errors");
const { verifyToken } = require("../utils/jwt");

const authentication = async (request, response, next) => {
  const token = request.signedCookies.token;
  if (!token) {
    throw new UnauthenticatedError("Authentication Invalid!");
  }
  try {
    // const payload = jwt.verify(token, process.env.JWT_SECRET);
    const payload = verifyToken(token);
    request.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication Invalid!");
  }
};

// const simpleAuthorization = (request, response, next) => {
//   if (request.user.role !== "admin") {
//     throw new ForbiddenError("Unauthorized to access this route!");
//   }
//   next();
// };

const authorization = (...roles) => {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError("Unauthorized to acess this route!");
    }
    next();
  };
};

module.exports = { authentication, authorization };
