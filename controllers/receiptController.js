const receiptService = require("../services/receiptService");
const bufferConverter = require("../middleware/bufferConverter");
const config = require("../config");
const logger = require("../logger");

exports.createReceipt = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    logger.info("USER: " + req.user);
    const id = await receiptService.create(req.body);
    const roles = req.user?.realm_access?.roles || [];
    const isSelf = req.body.user_id === userId;
    const isAdmin = roles.includes("admin");
    /* if (!config.DISABLE_ADMIN_CHECK && !isAdmin && !isSelf) {
      logger.warn(
        `Access denied to createReceipt. Requested: ${req.body.user_id}, Authenticated: ${userId}`,
      );
      return res.status(403).json({ message: "Access denied" });
    }*/

    logger.info(
      `Receipt with body ${JSON.stringify(req.body)} created with ID ${id} by user ${req.body.user_id}`,
    );

    if (req.body.represented.names !== undefined) {
      await receiptService.createRepresented(id, req.body.represented.names);
      logger.info(`Represented data linked to receipt ${id} by user ${userId}`);
    } else if (req.body.represented.length !== 0) {
      await receiptService.createRepresented(id, req.body.represented);
      logger.info(`Represented data linked to receipt ${id} by user ${userId}`);
    }
    if (req.body.other !== "") {
      await receiptService.createOther(id, req.body.other);
      logger.info(`Other data linked to receipt ${id} by user ${userId}`);
    }
    if (req.body.charged_companies.length > 0) {
      await receiptService.createCompanyCharge(id, req.body.charged_companies);
      logger.info(
        `Charged companies linked to receipt ${id} by user ${userId}`,
      );
    }

    res.status(201).json({ id, message: "Receipt created" });
  } catch (err) {
    logger.error("Error in createReceipt:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllReceipts = async (req, res) => {
  try {
    const roles = req.user?.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to getAllReceipts by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const receipts = await receiptService.getAll();
    logger.info(`All receipts fetched by admin ${userId}`);
    res.json(receipts);
  } catch (err) {
    logger.error("Error in getAllReceipts:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserReceipts = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    const roles = req.user?.realm_access?.roles || [];
    const isAdmin = roles.includes("admin");
    const isSelf = req.params.user === userId;
    console.log("SELF " + isSelf);
    if (!config.DISABLE_ADMIN_CHECK && !isAdmin && !isSelf) {
      logger.warn(
        `Access denied to getUserReceipts. Requested: ${req.params.user}, Authenticated: ${userId}`,
      );
      return res.status(403).json({ message: "Access denied" });
    }

    const receipts = await receiptService.getByUser(req.params.user);
    logger.info(
      `Receipts fetched for user ${req.params.user} by ${isAdmin ? "admin" : "user"} ${userId}`,
    );
    res.json(receipts);
  } catch (err) {
    logger.error("Error in getUserReceipts:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await receiptService.getById(req.params.id);
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !receipt) {
      logger.warn(
        `Receipt not found: ID ${req.params.id}, requested by user ${userId}`,
      );
      return res.status(404).json({ error: "Not found" });
    }

    logger.info(`Receipt ID ${req.params.id} fetched by user ${userId}`);
    res.json(receipt);
  } catch (err) {
    logger.error(`Error in getReceiptById (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateReceipt = async (req, res) => {
  try {
    const roles = req.user?.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to updateReceipt by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await receiptService.update(req.params.id, req.body);
    logger.info(`Receipt ID ${req.params.id} updated by user ${userId}`);
    res.json({ message: "Receipt updated" });
  } catch (err) {
    logger.error(`Error in updateReceipt (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReceipt = async (req, res) => {
  try {
    const roles = req.user?.realm_access?.roles || [];
    const userId = req.user?.sub || "unknown";

    if (!config.DISABLE_ADMIN_CHECK && !roles.includes("admin")) {
      logger.warn(`Access denied to deleteReceipt by user ${userId}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    await receiptService.remove(req.params.id);
    logger.info(`Receipt ID ${req.params.id} deleted by user ${userId}`);
    res.json({ message: "Receipt deleted" });
  } catch (err) {
    logger.error(`Error in deleteReceipt (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const userId = req.user?.sub || "unknown";
    const bufObj = await receiptService.generatePDF(req.params.id);
    const signedURL = await bufferConverter.uploadBuffer(
      bufObj.buf,
      bufObj.filename,
    );
    logger.info(
      `PDF generated for receipt ID ${req.params.id} by user ${userId}`,
    );
    res.json({ signedUrl: signedURL });
  } catch (err) {
    logger.error(`Error in generatePdf (ID ${req.params.id}):`, err);
    res.status(500).json({ error: err.message || "PDF generation failed" });
  }
};
