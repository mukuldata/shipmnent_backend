const { SESClient } = require("@aws-sdk/client-ses");
const { SQSClient} = require("@aws-sdk/client-sqs")
require("dotenv").config();

const SESConfig = {
  credentials:{
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region:process.env.AWS_REGION

}

const SQSConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
};


const SES=new SESClient(SESConfig);
const SQS=new SQSClient(SQSConfig);

module.exports = {
  SES,
  SQS
};