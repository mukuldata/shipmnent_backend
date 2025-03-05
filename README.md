

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
