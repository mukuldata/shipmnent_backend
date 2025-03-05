const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });
};

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
      return res.status(400).json({ status : "error", message: "Name, email and password all are required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ status: "error", message: "User with this email already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ status: "success", message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error registering user", error });
  }
};

// User Login

/* 
Usecase:
Purpose: The refresh token is used to obtain a new access token once the old one expires,
 without requiring the user to log in again.
Expiration: Refresh tokens generally have a longer lifespan than access tokens 
(e.g., days, weeks, or months).
Use: When the access token expires, the client sends the refresh token to the server
 (in a secure manner, e.g., via HTTPS) 
to receive a new access token. If the refresh token is valid, a new access token 
is generated and returned.
 */

/* 

Flow:
User logs in (providing credentials).
Server generates both access and refresh tokens.
User makes requests with the access token.
When the access token expires, the client uses the refresh token to request a new access token.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if(!email || !password){
      return res.status(400).json({ status : "error", message: "Email and password all are required" });
    }


    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict" });

    res.json({status: "success", message: "Login successful", accessToken });
  } catch (error) {
    res.status(500).json({ status : "error", message: "Login failed", error });
  }
};

// Token Refresh
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ status: "error", message: "Unauthorized" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ status: "error", message: "Forbidden" });

      const newAccessToken = generateAccessToken({ _id: decoded.userId });
      res.json({status: "success",message: "Token refreshed successfully", accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: "Token refresh failed", error });
  }
};
