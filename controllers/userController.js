const userService = require("../services/userService");
const config = require("../config");
const logger = require("../logger");

exports.createUser = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to createUser by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const id = await userService.create(req.body);

    logger.info(`User created with ID ${id} by user ${userId}`);
    res.status(201).json({ id: id, message: "User created" });
  } catch (err) {
    logger.error("Error in createUser:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    /* if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to getAllUsers by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }*/

    const users = await userService.getAll();
    logger.info(`All users fetched by user ${userId}`);
    res.json(users);
  } catch (err) {
    logger.error("Error in getAllUsers:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    const userId = req.user?.sub || "unknown";

    if (!user) {
      logger.warn(
        `User not found: ID ${req.params.id} (requested by ${userId})`,
      );
      return res.status(404).json({ error: "Not found" });
    }

    logger.info(`User fetched: ID ${req.params.id} by user ${userId}`);
    res.json(user);
  } catch (err) {
    logger.error(`Error in getUserById (ID: ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to updateUser by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await userService.update(req.params.id, req.body);
    logger.info(`User updated: ID ${req.params.id} by user ${userId}`);
    res.json({ message: "User updated" });
  } catch (err) {
    logger.error(`Error in updateUser (ID: ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to deleteUser by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await userService.remove(req.params.id);
    logger.info(`User deleted: ID ${req.params.id} by user ${userId}`);
    res.json({ message: "User deleted" });
  } catch (err) {
    logger.error(`Error in deleteUser (ID: ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};
