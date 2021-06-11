const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

//constants
const PORT = process.env.PORT || 9091;

// middlewares
const morgan = require("morgan");

const app = express();

// db conn
mongoose.connect(
  "mongodb://localhost/auth-service",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log(`AUTH SERVICE DB CONN ACK`)
);

// MODELS
const User = require("./model/User");

app.use(express.json());
app.use(morgan("dev"));

app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) res.status(409).json({ message: "User already exists 🤔" });
  else {
    const newUser = new User({ name, email, password });
    newUser.save();
    return res.status(200).json(newUser);
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) res.status(404).json({ message: "User does not exists 🤨" });
  else {
    if (password !== user.password)
      return res.status(401).json({ message: "Incorrect Password 😡" });

    const payload = { email, name: user.name };
    jwt.sign(payload, "SECRET", (err, token) => {
      if (err) console.error(err);
      else return res.json({ token });
    });
  }
});

app.listen(PORT, () => console.log(`AUTH SERVICE AT ${PORT}`));
