const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const config = require("../config");
const url = process.env.KEYCLOAK_URL;
const client = jwksClient({
  jwksUri: `${url}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const verifyToken = (req, res, next) => {
  if (config.DISABLE_VERIFY_TOKEN) {
    req.user = { preferred_username: "dev_user" };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      audience: "account", // or your client ID
      issuer: `${url}/realms/${process.env.KEYCLOAK_REALM}`,
      algorithms: ["RS256"],
    },
    (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      req.user = decoded;
      next();
    },
  );
};

module.exports = verifyToken;
