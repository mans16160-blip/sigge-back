const axios = require("axios");
const logger = require("../logger");
const url = process.env.KEYCLOAK_URL;
const secret = process.env.CLIENT_SECRET;
const id = process.env.CLIENT_ID;
const realm = process.env.KEYCLOAK_REALM;
const redirectUri = process.env.REDIRECT_URI;
exports.resetPassword = async (req, res) => {
  const identifier = req.body.usernameOrEmail;

  try {
    const tokenRes = await axios.post(
      `${url}/realms/${realm}/protocol/openid-connect/token`,
      new URLSearchParams({
        client_id: id,
        grant_type: "client_credentials",
        client_secret: secret,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const adminToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      `${url}/admin/realms/${realm}/users?search=${encodeURIComponent(identifier)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    let user = userRes.data[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    logger.info("Sending reset email to:", user.email + " " + user.id);

    const response = await axios.put(
      `${url}/admin/realms/${realm}/users/${user.id}/execute-actions-email`,
      ["UPDATE_PASSWORD"],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        params: {
          client_id: id,
          redirect_uri: redirectUri,
        },
      },
    );
    logger.info("Email reset response status:", response.status);

    res.json({ message: "Password reset email sent." });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

exports.getAdminToken = async () => {
  const res = await axios.post(
    `${url}/realms/${realm}/protocol/openid-connect/token`,
    new URLSearchParams({
      client_id: id,
      grant_type: "client_credentials",
      client_secret: secret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return res.data.access_token;
};
