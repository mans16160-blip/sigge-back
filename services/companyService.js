const { pool } = require("../db");
const logger = require("../logger");

exports.create = async ({ company_name }) => {
  const sql = `
    INSERT INTO sigge.company (company_name) VALUES (?);
    SELECT company_id, company_name
    FROM sigge.company
    WHERE company_id = LAST_INSERT_ID();
  `;
  const [results] = await pool.query(sql, [company_name]);

  // results[0] is OkPacket for the INSERT, results[1] is the SELECT rows
  const insertId = results[0].insertId;
  const row = results[1][0];

  logger.info(`Company created in DB: ${row.company_name} (ID: ${insertId})`);
  return insertId;
};

exports.getAll = async () => {
  try {
    const result = await pool.query("SELECT * FROM sigge.company");
    logger.info(`Fetched ${result.rowCount} companies from DB`);
    return result[0];
  } catch (err) {
    logger.error("Error in companyService.getAll:", err);
    throw err;
  }
};

exports.getById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sigge.company WHERE company_id = ${id}`,
      
    );
    logger.info(`Fetched company by ID: ${id}`);

    return result[0][0];
  } catch (err) {
    logger.error(`Error in companyService.getById (ID: ${id}):`, err);
    throw err;
  }
};

exports.update = async (id, { company_name }) => {
  try {
    await pool.query(
      `UPDATE sigge.company SET company_name = '${company_name}'
       WHERE company_id = ${id}`,
    );
    logger.info(`UPDATE sigge.company SET company_name = '${company_name}'
       WHERE company_id = ${id}`)
    logger.info(`Company updated: ID ${id}, new name: ${company_name}`);
  } catch (err) {
    logger.error(`Error in companyService.update (ID: ${id}):`, err);
    throw err;
  }
};

exports.remove = async (id) => {
  try {
    await pool.query(`DELETE FROM sigge.company WHERE company_id = ${id}`);
    logger.info(`Company deleted: ID ${id}`);
  } catch (err) {
    logger.error(`Error in companyService.remove (ID: ${id}):`, err);
    throw err;
  }
};
