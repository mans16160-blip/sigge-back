const costCenterService = require("../services/costCenterService");
const config = require("../config");
const logger = require("../logger");

exports.createCostCenter = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    const id = await costCenterService.create(req.body);
    logger.info(`Cost center created with ID ${id} by user ${userId}`);
    res.status(201).json({ id, message: "Cost center created" });
  } catch (err) {
    logger.error("Error in createCostCenter:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCostCenters = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to getAllCostCenters by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const costCenters = await costCenterService.getAll();
    logger.info(`All cost centers fetched by admin ${userId}`);
    res.json(costCenters);
  } catch (err) {
    logger.error("Error in getAllCostCenters:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCostCenterById = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    const costCenters = await costCenterService.getById(req.params.id);

    if (!costCenters) {
      logger.warn(
        `Cost center not found: ID ${req.params.id}, requested by user ${userId}`,
      );
      return res.status(404).json({ error: "Not found" });
    }

    logger.info(`Cost center ID ${req.params.id} fetched by user ${userId}`);
    res.json(costCenters);
  } catch (err) {
    logger.error(`Error in getCostCenterById (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCostCenter = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to updateCostCenter by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await costCenterService.update(req.params.id, req.body);
    logger.info(`Cost center ID ${req.params.id} updated by user ${userId}`);
    res.json({ message: "Cost center updated" });
  } catch (err) {
    logger.error(`Error in updateCostCenter (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCostCenter = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to deleteCostCenter by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await costCenterService.remove(req.params.id);
    logger.info(`Cost center ID ${req.params.id} deleted by user ${userId}`);
    res.json({ message: "Cost center deleted" });
  } catch (err) {
    logger.error(`Error in deleteCostCenter (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};
