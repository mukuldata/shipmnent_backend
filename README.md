

**README**

**Project Overview**

This is a Node.js project that provides a RESTful API for managing orders and users. The project uses Express.js as the web framework, MongoDB as the database, and Redis for caching. The project also uses Amazon Web Services (AWS) for sending emails via Simple Email Service (SES) and for message queuing via Simple Queue Service (SQS).

**Deployed on** : https://shipment-backend-zqsm.onrender.com

**Getting Started**


1. Clone the repository: `git clone https://github.com/mukuldata/shipmnent_backend`
2. Install dependencies: `npm install`
3. Create a `.env` file and add the following environment variables from .env.sample
4. Start the server: `npm start`

**API Routes**

### Auth Routes

* **POST /api/auth/register**: Register a new user
* **POST /api/auth/login**: Login a user
* **POST /api/auth/refresh**: Refresh a user's access token

### Order Routes

* **POST /api/orders**: Create a new order
* **GET /api/orders/:id**: Get an order by ID
* **GET /api/orders**: Get all orders for a user


**Project Structure**

* `src`: Source code directory
	+ `config`: Configuration files (e.g. database, Redis, AWS)
	+ `controllers`: Controller files (e.g. auth, order, user)
	+ `models`: Model files (e.g. order, user)
	+ `routes`: Route files (e.g. auth, order, user)
	+ `services`: Service files (e.g. inventory, email)
	+ `utils`: Utility files (e.g. seed inventory)
	+ `workers`: Worker files (e.g. order processor)
* `package.json`: Project metadata and dependencies


**Workflow**

Here's an overview of the workflow:

1. **User Registration**:
	* User sends a `POST /api/auth/register` request with their name , email and password.
	* The server creates a new user document in the MongoDB database and saves a hashed password .
	* The server returns a success response to the user.
2. **User Login**:
	* User sends a `POST /api/auth/login` request with their email and password.
	* The server verifies the user's credentials and creates a new JWT access token.
	* The server returns the access token(valid for 15 minutes) to the user and also saves a refresh token in cookies (valid for 7 days)
3. **Access Token Creation**:
	* The access token is created using the `JWT_SECRET` environment variable.
	* The access token is set to expire after a certain amount of time (In configuartion : 15 minutes).
4. **Refresh Token Creation**:
	* A refresh token is created and saved in the user's cookie.
	* The refresh token is used to obtain a new access token when the current one expires.
5. **Create Order**:
	* User sends a `POST /api/orders` request with their order details.
	* The server creates a new order document in the MongoDB database.
	* The server adds the order details to a AWS SQS queue.
6. **Order Processing**:
	* A worker process (e.g. `orderProcessor.js`) consumes the order details from the AWS SQS queue.
	* The worker process processes the order and sends an email to the user using AWS SES.
7. **Email Sending**:
	* The email is sent to the user using AWS SES.
	* The email contains the order details and a confirmation message.
7. **Get Order**:
	* The Order is saved in Redis for quick fetching (Expiration time of 10 minutes)
        * If not found in Redis , the order is fetched from MongoDB and updated in Redis.


### Images of Redis storage
![image](https://github.com/user-attachments/assets/439c2612-c72f-4356-bd00-960a2fb428c4)

### Email Recieved
![image](https://github.com/user-attachments/assets/a506e6be-e2aa-444e-a3a0-69dd5faa29a3)

### Database
![image](https://github.com/user-attachments/assets/aff7d7d0-d9e8-4f78-9c63-fa3241334cb8)

