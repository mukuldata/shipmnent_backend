const Order = require("../models/order.model");
const User=require("../models/user.model");
const {SES,SQS}= require("../config/awsClient");
const { ReceiveMessageCommand,DeleteMessageCommand} = require("@aws-sdk/client-sqs");
const {SendEmailCommand} =require("@aws-sdk/client-ses");
const redisClient= require("../config/redisClient");

require('dotenv').config();

// Function to send email notification via SES
const sendEmailNotification = async (orderDetails,userDetails) => {
  const {email}=userDetails;
  const {orderId,status,items,totalAmount}=orderDetails;

  const subject = `Your Order ${status}: ${orderId}`;
  const body = `
    <h1>Order ID: ${orderId}</h1>
    <h2>Status: ${status}</h2>
    <p><b>Purchased Items:</b></p>
    <ul>
      ${items.map(item => `<li>${item.name} - ${item.quantity}</li>`).join('')}
    </ul>
    <p>Total Amount: ${totalAmount}</p>
    <p>Thank you for your purchase!</p>
  `;

  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source:process.env.SENDER_VERIFIED_EMAIL, 
  };

  try {
    const sendEmailCommand = new SendEmailCommand(params);
    const sendEmailResponse = await SES.send(sendEmailCommand);
    console.log("Email sent successfully",sendEmailResponse);
    /* 
    Email sent successfully {
  '$metadata': {
    httpStatusCode: 200,
    requestId: 'db1b226f-aab8-439e-bb8f-39432c64c818',
    extendedRequestId: undefined,
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  },
  MessageId: '0109019566baeaba-a4dde185-0547-4260-a497-4991d10857d5-000000'
}
     */
  } catch (error) {
    console.error("Error sending email:", error);
  }
};



const processOrder = async (orderId,userId) => {
  try {

    const userDetails=await User.findById(userId);
    const orderDetails = await Order.findOne({ orderId });

    if(!userDetails){
      console.error(`User ${userId} not found.`);
      return;
    }

    if (!orderDetails) {
      console.error(`Order ${orderId} not found.`);
      return;
    }

    // Processing logic
    console.log(`Processing order: ${orderId}`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); 

    // Randomly fail some orders for testing
    const isSuccess = Math.random() > 0.2;

    orderDetails.status = isSuccess ? "Processed" : "Failed";
    await orderDetails.save();

    await sendEmailNotification(orderDetails,userDetails);

      // Delete old cache entry to prevent stale data
    await redisClient.del(`order:${orderId}`);

    console.log(`Order ${orderId} ${orderDetails.status}`);
  } catch (error) {
    console.error("Processing error:", error);
  }
};

// Poll SQS queue for messages
const pollQueue = async () => {
  try {
    const params = { QueueUrl: process.env.SQS_QUEUE_URL, MaxNumberOfMessages: 1, WaitTimeSeconds: 5 };
   
    const recieveCommand = new ReceiveMessageCommand(params);
    const recieveResponse = await SQS.send(recieveCommand);

    // console.log("Poll Queue and recieveResponse",recieveResponse);
    /* 
    {
    Poll Queue and recieveResponse 
  Messages: [
    {
      MessageId: 'f21bade1-6103-4c28-8548-617c38197b31',
      ReceiptHandle: 'AQEB/N4Ll4FrSD9PXC0FKToNhSIKROouB0ke25Eu+ZU0Mz47uh0jKlf/mcAsJVEVBYlsBpW97F2a3Q8CmL/7DM7yGPv7v7qffKrTMor2kmmCbHw+fVTCpb7fihTq+SW8ez7yqe2fJhfFD2FMXSDODy+C55UeU9cNo4dr50wipWthrxqiAYwAiS/fe99R6iJCN39u7D72RYqFRIW2h4NeFN23U06XSdxqJgr8jIC1WOHcqru/7Bo88i5ZqEzyrD2kp7vcSPMJ5mILGRUVwdErVtjd0M1fKnwXI9rddkHkF5I8vfyaDkGyB/l7fBKuu46t7xBR7o2661boW15+yKBryWuDCReXl3MgK/7X7IIpNnrz3nGbbV0DLKcuD+BaSBvdwddMiVmM/gwd6zKbzfxP7A7Msw==',    
      MD5OfBody: '4df3b253da7a61ad7baba6648aeedf87',
      Body: '{"orderId":"5c30937c-9fbf-4c4c-9c4c-8d2b93a24836","userId":"67c82a4761c1fac2f8b5dd87"}'
    }
  ]
}
     */


    if (recieveResponse.Messages) {
      for (const message of recieveResponse.Messages) {
        const { orderId,userId} = JSON.parse(message.Body);
        await processOrder(orderId,userId);

        // Delete message from queue after processing
        const deleteCommand = new DeleteMessageCommand({ QueueUrl: process.env.SQS_QUEUE_URL, ReceiptHandle: message.ReceiptHandle });
          const deleteResponse = await SQS.send(deleteCommand);
          // console.log(" Poll Queue : deleteResponse",deleteResponse);

          /* 
           deleteResponse {
  '$metadata': {
    httpStatusCode: 200,
    requestId: 'dc398a5f-7830-5f62-80a5-ea1d1b705d74',
    extendedRequestId: undefined,
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0
  }
}
           */
      }
    }
  } catch (error) {
    console.error("Polling error:", error);
  }

  setTimeout(pollQueue, Number(process.env.POLL_QUEUE_INTERVAL)); // Keep polling every 3 seconds
};

module.exports = { pollQueue , processOrder,sendEmailNotification};
