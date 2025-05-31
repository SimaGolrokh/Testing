const ipWhitelist = [
  "127.0.0.1",
  "::1",
  "172.20.0.1",
  "172.18.0.1",
  "192.168.0.",
  "192.168.1.",
  "192.168.2.",
  "87.123.51.234",
  "46.223.163.16",
  "128.192.12.110",
  "195.12.232.247",
  "146.70.185.32",
  "46.142.176.137"
];


const authenticateIP = (req, res, next) => {
  const rawIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

  const clientIP = rawIP.replace("::ffff:", "");

  const isAllowed = ipWhitelist.some((allowedPrefix) => clientIP.startsWith(allowedPrefix));

  if (!isAllowed) {
    console.warn("❌ Blocked IP:", clientIP);
    return res.status(403).json({ error: "Access denied. IP not allowed.", ip: clientIP });
  }

  next();
};

module.exports = authenticateIP;
