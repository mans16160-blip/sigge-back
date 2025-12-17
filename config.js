const parseBool = (value, fallback = false) =>
  value === undefined ? fallback : value === "true";

module.exports = {
  DISABLE_ADMIN_CHECK: parseBool(process.env.DISABLE_ADMIN_CHECK),
  DISABLE_VERIFY_TOKEN: parseBool(process.env.DISABLE_VERIFY_TOKEN),
  DISABLE_KEYCLOAK_PROTECTION: parseBool(
    process.env.DISABLE_KEYCLOAK_PROTECTION,
  ),
};
