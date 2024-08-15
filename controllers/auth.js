const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports.signUp = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);
    if (errors.length > 0) {
      let error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.map((e) => e.msg);
      throw error;
    }
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 12, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      try {
        const user = new User({
          email: email,
          name: name,
          password: hashedPassword,
        });
        const result = await user.save();
        return res
          .status(201)
          .json({ message: "User created", userId: result._id });
      } catch (error) {
        if (error) {
          error.statusCode = 500;
          error.message = error._message;
          return next(error);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("A user with this email is not found");
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    bcrypt.compare(password, user.password, (err, isEqual) => {
      if (err) {
        console.log(err);
      }
      if (!isEqual) {
        const error = new Error("Awrong password");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "secret",
        { expiresIn: "1h" }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    });
  } catch (error) {
    next(error);
  }
};
