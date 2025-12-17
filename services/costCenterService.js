const { pool } = require("../db");
const logger = require("../logger");

exports.create = async ({ cost_center_number, cost_center_name}) => {
  const sql = `
    INSERT INTO sigge.cost_center (cost_center_number, cost_center_name) VALUES (?, ?);
    SELECT cost_center_id
    FROM sigge.cost_center
    WHERE cost_center_id = LAST_INSERT_ID();
  `;
  const [results] = await pool.query(sql, [cost_center_number, cost_center_name]);

  // results[0] is OkPacket for the INSERT, results[1] is the SELECT rows
  const insertId = results[0].insertId;
  const row = results[1][0];

  logger.info(`Cost center created in DB: ${row.cost_center_name} (ID: ${insertId})`);
  return insertId;
};

exports.getAll = async () => {
  try {
    const result = await pool.query("SELECT * FROM sigge.cost_center");
    logger.info(`Fetched ${result.rowCount} cost centers`);
    return result[0];
  } catch (err) {
    logger.error("Error in costCenterService.getAll:", err);
    throw err;
  }
};

exports.getById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sigge.cost_center WHERE cost_center_id = ${id}`,
    );
    logger.info(`Fetched cost center by ID: ${id}`);
    return result[0][0];
  } catch (err) {
    logger.error(`Error in costCenterService.getById (ID: ${id}):`, err);
    throw err;
  }
};

exports.update = async (id, { cost_center_number, cost_center_name }) => {
  try {
    await pool.query(
      `UPDATE sigge.cost_center
       SET cost_center_number = ${cost_center_number}, cost_center_name = '${cost_center_name}'
       WHERE cost_center_id = ${id}`,
    );
    logger.info(
      `Cost center updated: ID ${id}, Number: ${cost_center_number}, Name: ${cost_center_name}`,
    );
  } catch (err) {
    logger.error(`Error in costCenterService.update (ID: ${id}):`, err);
    throw err;
  }
};

exports.remove = async (id) => {
  try {
    await pool.query(
      `DELETE FROM sigge.cost_center WHERE cost_center_id = ${id}`,
    );
    logger.info(`Cost center deleted: ID ${id}`);
  } catch (err) {
    logger.error(`Error in costCenterService.remove (ID: ${id}):`, err);
    throw err;
  }
};
