const companyService = require("../services/companyService");
const config = require("../config");
const logger = require("../logger");

exports.createCompany = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    const id = await companyService.create(req.body);
    logger.info(`Company created with ID ${id} by user ${userId}`);
    res.status(201).json({ id, message: "Company created" });
  } catch (err) {
    logger.error("Error in createCompany:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";
    const companies = await companyService.getAll();
    logger.info(`All companies fetched by admin ${userId}`);
    res.json(companies);
  } catch (err) {
    logger.error("Error in getAllCompanies:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    const company = await companyService.getById(req.params.id);

    if (!company) {
      logger.warn(
        `Company not found: ID ${req.params.id}, requested by user ${userId}`,
      );
      return res.status(404).json({ error: "Not found" });
    }

    logger.info(`Company ID ${req.params.id} ed by user ${userId}`);
    res.json(company);
  } catch (err) {
    logger.error(`Error in getCompanyById (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to updateCompany by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await companyService.update(req.params.id, req.body);
    logger.info(`Company ID ${req.params.id} updated by user ${userId}`);
    res.json({ message: "Company updated" });
  } catch (err) {
    logger.error(`Error in updateCompany (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const roles = req.user.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to deleteCompany by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await companyService.remove(req.params.id);
    logger.info(`Company ID ${req.params.id} deleted by user ${userId}`);
    res.json({ message: "Company deleted" });
  } catch (err) {
    logger.error(`Error in deleteCompany (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};
