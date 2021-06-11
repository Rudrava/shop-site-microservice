const express = require("express");
const mongoose = require("mongoose");
const amqp = require("amqplib");

const dotenv = require("dotenv");
dotenv.config();

//constants
const PORT = process.env.PORT || 9093;

// middlewares
const morgan = require("morgan");
const isAuthenticated = require("../middlewares/isAuthenticated");

const app = express();

// db conn
mongoose.connect(
  "mongodb://localhost/product-service",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log(`PRODUCT SERVICE DB CONN ACK`)
);

// ::MQ::
let channelQ, connQ;
(async () => {
  connQ = await amqp.connect("amqp://localhost:5672");
  channelQ = await connQ.createChannel();
  await channelQ.assertQueue("PRODUCT_ORDER");

  console.log("CONN ACK rabit mq server PRODUCT_ORDER QUEUE");
})();

// MODELS
const Product = require("./models/Product");

app.use(express.json());
app.use(morgan("dev"));
app.use(isAuthenticated);

// Routes
app.post("/product/create", async (req, res) => {
  // console.log("req", req.headers);
  const { name, description, price } = req.body;
  const newProduct = new Product({
    name,
    description,
    price,
    CreatedBy: { name: req.user.name, email: req.user.email },
  });
  newProduct.save();
  res.status(200).json({ newProduct });
});

app.post("/product/buy", async (req, res) => {
  const { products } = req.body;
  const productList = await Product.find({ _id: { $in: products } });

  // send it to order channel
  channelQ.sendToQueue(
    "ORDER",
    Buffer.from(
      JSON.stringify({
        productList,
        userEmail: req.user.email,
      })
    )
  );
  let orders;
  channelQ.consume("PRODUCT_ORDER", (data) => {
    console.log("ACK JOB PRODUCT_ORDER");
    orders = JSON.parse(data.content);
    console.log("here");
    res.status(200).json(orders);
    return channelQ.ack(data);
  });
});

app.listen(PORT, () => console.log(`PRODUCT SERVICE AT ${PORT}`));
