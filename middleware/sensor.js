const jwt = require("jsonwebtoken");

const verifySensorToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.sensor = decoded; // attach to request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token invalid" });
  }
};

module.exports = verifySensorToken;