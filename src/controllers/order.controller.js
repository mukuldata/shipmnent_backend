const Order = require("../models/order.model");
const { v4: uuidv4 } = require("uuid");
const { checkStockAvailability, updateStockLevels } = require("../services/inventory.service");
const {sqs}= require("../config/awsClient");
const redisClient= require("../config/redisClient");
const {SQS}= require("../config/awsClient");
const {SendMessageCommand}= require("@aws-sdk/client-sqs");

// Create Order
exports.createOrder = async (req, res) => {
    try {
      const { items } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ status : "error", message: "Order must contain at least one item." });
      }
  
      // Check inventory
      const unavailableItems = await checkStockAvailability(items);
      if (unavailableItems.length > 0) {
        return res.status(400).json({ status : "error", message: "Some items are out of stock", unavailableItems });
      }
  
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
      // Create order in Pending state
      const newOrder = new Order({
        orderId: uuidv4(),
        userId: req.user.userId,
        items,
        totalAmount,
        status: "Pending",
      });
  
      await newOrder.save();

  
      // Deduct stock levels
      await updateStockLevels(items);

         // Store order in Redis immediately after creation
           await redisClient.set(`order:${newOrder.orderId}`, JSON.stringify(newOrder), {
          EX: Number(process.env.REDIS_CACHE_EXPIRATION) ||600,
        });
  
      // Send order to AWS SQS
      try{
        const params = {
          QueueUrl: process.env.SQS_QUEUE_URL,
          MessageBody: JSON.stringify({
            orderId: newOrder.orderId,
            userId: newOrder.userId,
          }),
        };
        const sendMessageCommand = new SendMessageCommand(params);
        const sendMessageResponse = await SQS.send(sendMessageCommand);
        console.log(
          "Order pushed to queue and sendMessageResponse",
          sendMessageResponse
        );
        /* 

   Order pushed to queue and sendMessageResponse {
  '$metadata': {
    httpStatusCode: 200,
    requestId: 'dbd5277f-16b2-541a-b5ff-473d776bd155',
    extendedRequestId: undefined,
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  },
  MD5OfMessageBody: 'aff955c729cdc9e82357fcad2d6576e1',
  MessageId: '13ef2525-d4c9-42ab-94ca-1d415220ad5e'
}
         */
      }catch(err){
        console.error("SQS Error:", err);
      }
  
      // sqs.sendMessage(params, (err, data) => {
      //   if (err) {
      //     console.error("SQS Error:", err);
      //   } else {
      //     console.log("data pushed to SQS:", data);
      //     console.log("Order pushed to SQS:", { orderId: newOrder.orderId, messageId: data.MessageId});
      //   }
      // });
  
      res.status(201).json({ status: "success", message: "Order placed successfully and queued for processing", order: newOrder });
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ status: "error", message: "Order creation failed", error });
    }
  };
// Get Order Details
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // 1.Check if order is in Redis Cache
    const cachedOrder = await redisClient.get(`order:${orderId}`);
    if (cachedOrder) {
      console.log("Cache Hit! Returning order from Redis");
      return res.json({status : "success", message:"Cached order from Redis", data:JSON.parse(cachedOrder) }); 
    }

    // 2️. If not found in cache, fetch from MongoDB
    const order = await Order.findOne({orderId});
    if (!order) {
      return res.status(404).json({staus : "error", message: "Order not found" });
    }

    // 3️. Store fetched order in Redis (Set Expiration to 10 mins)

    await redisClient.set(`order:${orderId}`, JSON.stringify(order), {
      EX: Number(process.env.REDIS_CACHE_EXPIRATION) ||600,   // 600 : 10 minute
    });

    console.log("Cache Miss! Order fetched from MongoDB");
    res.json({status : "success", message:"Order fetched from MongoDB", data:order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status : "error", message: " Error in fetching order" });
  }
};