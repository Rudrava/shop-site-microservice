const express = require("express");
const mongoose = require("mongoose");
const amqp = require("amqplib");

const dotenv = require("dotenv");
dotenv.config();

//constants
const PORT = process.env.PORT || 9092;

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
  () => console.log(`ORDER SERVICE DB CONN ACK`)
);

// MODELS
const Order = require("./models/Order");

// HELPERS
const createOrder = require("./lib/createOrder");

// ::MQ::
let channelQ, connQ;
(async () => {
  connQ = await amqp.connect("amqp://localhost:5672");
  channelQ = await connQ.createChannel();
  await channelQ.assertQueue("ORDER");
  channelQ.consume("ORDER", (data) => {
    console.log("ACK JOB ORDER");
    const { productList, userEmail } = JSON.parse(data.content);
    const newOrders = createOrder(productList, userEmail);
    channelQ.sendToQueue(
      "PRODUCT_ORDER",
      Buffer.from(JSON.stringify({ orders: newOrders }))
    );
    // TODO: save orders
    channelQ.ack(data);
  });
  console.log("CONN ACK rabit mq server ORDER QUEUE");
})();

app.use(express.json());
app.use(morgan("dev"));

app.listen(PORT, () => console.log(`ORDER SERVICE AT ${PORT}`));
