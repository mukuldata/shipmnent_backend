const jwt = require("jsonwebtoken");

exports.authenticateUser = (req, res, next) => {
  try{
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({status: "error", message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ status: "error", message: "Forbidden" });

    req.user = decoded;
    next();
  });
}catch(error){
  res.status(500).json({ status: "error", message: "Authentication failed", error });
}
};
