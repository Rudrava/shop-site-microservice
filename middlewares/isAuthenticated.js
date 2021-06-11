const jwt = require("jsonwebtoken");

const isAuthenticated = async (req, res, next) => {
  let token;
  try {
    token = req.headers["authorization"].split(" ")[1];
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Not a great thing you are doing 🙃" });
  }
  jwt.verify(token, "SECRET", (err, user) => {
    if (err) {
      console.log("here");
      return res
        .status(401)
        .json({ message: "Not authorized to access this content 🛑" });
    } else {
      req.user = user;
      next();
    }
  });
};

module.exports = isAuthenticated;
