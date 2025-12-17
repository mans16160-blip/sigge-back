const { pool } = require("../db");
const logger = require("../logger"); // <- make sure you have this
const dayjs = require("dayjs");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { LexModelBuildingService } = require("aws-sdk");
exports.create = async ({
  creation_date,
  receipt_date,
  user_id,
  company_card,
  net,
  tax,
  image_links,
  description,
  represented,
}) => {
  try {
    const deductData =
      represented.food_amount !== undefined
        ? calcDeductibleVAT(represented)
        : { deductibleVAT: 0, allowedBaseEx: 0, disallowedBaseEx: 0 };
    const sql = 
      `INSERT INTO sigge.receipt (creation_date, receipt_date, user_id, company_card, tax, net, description, deduct_vat, allowed_base_ex, disallowed_base_ex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    SELECT receipt_id
    FROM sigge.receipt
    WHERE receipt_id = LAST_INSERT_ID();`
    const [results] = await pool.query(sql,
      [
        creation_date,
        receipt_date,
        user_id,
        company_card,
        tax,
        net,
        description,
        deductData.deductibleVAT,
        deductData.allowedBaseEx,
        deductData.disallowedBaseEx,
      ],)
      logger.info(JSON.stringify(results))
      const insertId = results[1][0].receipt_id;
  const row = results[1][0];
    logger.info(`Created receipt with ID: ${insertId}`);
    createImages(image_links, row.receipt_id);
    return insertId;
  } catch (err) {
    logger.error("Error creating receipt:", err);
    throw err;
  }
};
function calcDeductibleVAT({
  names,
  food_amount,
  drink_amount,
  tip_amount = 0,
  is_full_meal,
  useSchablon = false,
}) {
  const people = Array.isArray(names) ? names.length : 0;
  if (people <= 0) return { moms: 0, deductibleCost: 0, nonDeductibleCost: 0 };

  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

  const foodEx = food_amount / 1.12;
  const foodVAT = food_amount - foodEx;
  const alcoholEx = drink_amount / 1.25;
  const alcoholVAT = drink_amount - alcoholEx;

  const totalEx = foodEx + alcoholEx;
  const totalVAT = foodVAT + alcoholVAT;
  const perPersonEx = totalEx / people;
  const vatPerPersonPaid = totalVAT / people;

  let moms;
  if (!is_full_meal) {
    const capEx = 60 * people;
    const allowedFoodEx = Math.min(foodEx, capEx);
    moms = allowedFoodEx * 0.12;
  } else {
    if (
      useSchablon &&
      perPersonEx > 300 &&
      alcoholEx > 0 &&
      vatPerPersonPaid >= 46
    ) {
      moms = 46 * people;
    } else if (perPersonEx <= 300) {
      moms = totalVAT;
    } else {
      const capEx = 300 * people;
      const foodShare = totalEx === 0 ? 0 : foodEx / totalEx;
      const alcoholShare = 1 - foodShare;
      const allowedFoodEx = capEx * foodShare;
      const allowedAlcoholEx = capEx * alcoholShare;
      moms = allowedFoodEx * 0.12 + allowedAlcoholEx * 0.25;
    }
  }

  let deductibleCost, nonDeductibleCost;
  if (!is_full_meal) {
    const capEx = 60 * people;
    const allowedFoodEx = Math.min(foodEx, capEx);
    const overCapFoodEx = Math.max(foodEx - capEx, 0);
    deductibleCost = allowedFoodEx;

    nonDeductibleCost = overCapFoodEx + tip_amount;
  } else {
    deductibleCost = 0;

    nonDeductibleCost = totalEx + tip_amount;
  }

  return {
    deductibleVAT: r2(moms),
    allowedBaseEx: r2(deductibleCost),
    disallowedBaseEx: r2(nonDeductibleCost),
  };
}
async function createImages(links, receipt_id) {
  logger.info(
    `Storing ${links.length} links in DB for receipt ${receipt_id}...`,
  );

  for (let i = 0; i < links.length; i++) {
    await pool.query(
      `INSERT INTO sigge.image_xref (receipt_id, link, page_number)
       VALUES (${receipt_id}, '${links[i]}', ${i + 1})`,
    );
    logger.info(`Stored link for page ${i + 1}: ${links[i]}`);
  }

  logger.info("All links stored successfully in correct order.");
}
exports.createRepresented = async (id, represented) => {
  try {
    const insertPromises = represented.map((item) =>
      pool.query(
        `INSERT INTO sigge.represented_xref (user_name, receipt_id)
         VALUES ('${item.custom ?item.custom:item.first_name}', ${id})`,
      ),
    );
    await Promise.all(insertPromises);
    logger.info(
      `Created ${represented.length} represented_xref rows for receipt ${id}`,
    );
  } catch (err) {
    logger.error("Error creating represented_xref:", err);
    throw err;
  }
};
exports.createOther = async (id, other) => {
  try {
    pool.query(
      `INSERT INTO sigge.receipt_other_info (note, receipt_id)
         VALUES ('${other}', ${id})`,
    );
    logger.info(`Created 1 receipt_other_info row for receipt ${id}`);
  } catch (err) {
    logger.error("Error creating receipt_other_info:", err);
    throw err;
  }
};

exports.createCompanyCharge = async (id, charged_companies) => {
  try {
    const insertPromises = charged_companies.map(async (companyId) => {
      return pool.query(
        `INSERT INTO sigge.company_charge_xref (company_id, receipt_id)
         VALUES (${companyId}, ${id})`,
      );
    });

    await Promise.all(insertPromises);
    logger.info(
      `Created ${charged_companies.length} company_charge_xref rows for receipt ${id}`,
    );
  } catch (err) {
    logger.error("Error creating company_charge_xref:", err);
    throw err;
  }
};

exports.getAll = async () => {
  try {
    const result = await pool.execute(`
SELECT
  r.*,

  /* images: filter in WHERE */
  COALESCE((
    SELECT JSON_ARRAYAGG(i.link)
    FROM sigge.image_xref AS i
    WHERE i.receipt_id = r.receipt_id
      AND i.link IS NOT NULL
  ), JSON_ARRAY()) AS images,

  /* represented: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', rx.receipt_id,
        'user_name',  rx.user_name
        /* add more rx fields here as 'key', rx.col */
      )
    )
    FROM sigge.represented_xref AS rx
    WHERE rx.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS represented,

  /* other: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', oi.receipt_id,
        'id',         oi.id,
        'note',       oi.note
        /* add more oi fields here */
      )
    )
    FROM sigge.receipt_other_info AS oi
    WHERE oi.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS other,

  /* company_charge: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', cc.receipt_id,
        'company_id', cc.company_id
        /* add more cc fields here */
      )
    )
    FROM sigge.company_charge_xref AS cc
    WHERE cc.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS company_charge

FROM sigge.receipt AS r
WHERE r.user_id <> 'fa492f11-07ed-484f-adff-41a5835c0e7e'
ORDER BY r.receipt_id DESC;
      `);

    logger.info(`Fetched ${JSON.stringify(result[0].length)} receipts`);
    return result[0];
  } catch (err) {
    logger.error("Error fetching receipts:", err);
    throw err;
  }
};

exports.getByUser = async (user_id) => {
  try {
    const result = await pool.query(
      ` SELECT
  r.*,

  /* images: filter in WHERE */
  COALESCE((
    SELECT JSON_ARRAYAGG(i.link)
    FROM sigge.image_xref AS i
    WHERE i.receipt_id = r.receipt_id
      AND i.link IS NOT NULL
  ), JSON_ARRAY()) AS images,

  /* represented: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', rx.receipt_id,
        'user_name',  rx.user_name
        /* add more rx fields here as 'key', rx.col */
      )
    )
    FROM sigge.represented_xref AS rx
    WHERE rx.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS represented,

  /* other: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', oi.receipt_id,
        'id',         oi.id,
        'note',       oi.note
        /* add more oi fields here */
      )
    )
    FROM sigge.receipt_other_info AS oi
    WHERE oi.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS other,

  /* company_charge: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', cc.receipt_id,
        'company_id', cc.company_id
        /* add more cc fields here */
      )
    )
    FROM sigge.company_charge_xref AS cc
    WHERE cc.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS company_charge

FROM sigge.receipt AS r
WHERE r.user_id = '${user_id}'
ORDER BY r.receipt_id DESC;
`,
    );
    return result[0]
  } catch (err) {
    logger.error("Error fetching receipts:", err);
    throw err;
  }
};

exports.getById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT
  r.*,

  /* images: filter in WHERE */
  COALESCE((
    SELECT JSON_ARRAYAGG(i.link)
    FROM sigge.image_xref AS i
    WHERE i.receipt_id = r.receipt_id
      AND i.link IS NOT NULL
  ), JSON_ARRAY()) AS images,

  /* represented: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', rx.receipt_id,
        'user_name',  rx.user_name
        /* add more rx fields here as 'key', rx.col */
      )
    )
    FROM sigge.represented_xref AS rx
    WHERE rx.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS represented,

  /* other: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', oi.receipt_id,
        'id',         oi.id,
        'note',       oi.note
        /* add more oi fields here */
      )
    )
    FROM sigge.receipt_other_info AS oi
    WHERE oi.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS other,

  /* company_charge: build object explicitly */
  COALESCE((
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'receipt_id', cc.receipt_id,
        'company_id', cc.company_id
        /* add more cc fields here */
      )
    )
    FROM sigge.company_charge_xref AS cc
    WHERE cc.receipt_id = r.receipt_id
  ), JSON_ARRAY()) AS company_charge

FROM sigge.receipt AS r
WHERE r.receipt_id = ${id}
ORDER BY r.receipt_id DESC;
`,
    );
    if (result.length === 0) {
      logger.warn(`Receipt with ID ${id} not found`);
    } else {
      logger.info(`Fetched receipt with ID ${id}`);
    }
    return result[0][0];
  } catch (err) {
    logger.error(`Error fetching receipt ${id}:`, err);
    throw err;
  }
};
exports.generatePDF = async (id) => {
  try {
    logger.info(`PDF generation requested for receipt ID ${id} `);
    //Hämta data
    const receiptData = await pool.query(
      `SELECT * FROM sigge.receipt WHERE receipt_id = ${id}`,
    );
    const receipt = receiptData[0][0];

    if (!receipt) {
      logger.warn(`Receipt not found for ID ${id}`);
    }

    receipt.total = receipt.net + receipt.tax;

    const [representedData, userData, chargedCompanyData, imageData] =
      await Promise.all([
        pool.query(
          `SELECT * FROM sigge.represented_xref WHERE receipt_id = ${id}`,
        ),
        pool.query(`SELECT * FROM sigge.user WHERE user_id = '${receipt.user_id}'`, [
          receipt.user_id,
        ]),
        pool.query(
          `SELECT * FROM sigge.company_charge_xref WHERE receipt_id = ${id}`,
        ),
        pool.query(`SELECT * FROM sigge.image_xref WHERE receipt_id = ${id}`,
        ),
      ]);
  
    const user = userData[0][0];
    const other = await pool.query(
      `SELECT * FROM sigge.receipt_other_info WHERE receipt_id = ${id}`,
    );

  
    if (other[0].length > 0) {
      receipt.other = other[0][0].note;
    }
    const companyData = await pool.query(
      `SELECT * FROM sigge.company WHERE company_id = ${user.company_id}`,
    );
 
    const company = companyData[0][0];
    receipt.company = company;
   
    const companyIds = chargedCompanyData[0].map((item) => item.company_id);

    let chargedCompanies = [];

    if (companyIds.length > 0) {
      const chargedCompaniesData = await pool.query(
        `SELECT company_id, company_name
FROM sigge.company
WHERE company_id IN (${companyIds.join(', ')});`,
      );

      chargedCompanies = chargedCompaniesData[0];
    }     
 logger.info('C: ' + JSON.stringify(         `SELECT company_id, company_name
FROM sigge.company
WHERE company_id IN (${companyIds.join(', ')});`,))
  
    //Skapa HTML
    const createHTML = async (receipt, chargedCompanies) => {
     
      const representedPage =
        representedData[0].length > 0
          ? `
    <div ></div>
    <div class="section">
      <h4>Representerade Personer</h4>
      <ul class="vertical-list">
       ${representedData[0].map((item, i) => `<li>${i + 1}. ${item.user_name}</li>`).join("")}
      </ul>
    </div>`
          : "";
      const imagePage =
        imageData[0].length > 0
          ? `

    ${imageData[0].map((item) => `<img class="receipt-image" src="${item.link}" alt="Kvitto Bild" />`)}
  `
          : "";

      const representedHeader =
        representedData[0].length > 0 ? `<th>Antal Representerade</th>` : "";

      const representedCell =
        representedData[0].length > 0
          ? `<td>${representedData[0].length}</td>`
          : "";
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      padding: 10px;
      color: #333;
    }

    #header {
      font-size: 19px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .sub-header {
      font-size: 15px;
      color: #555;
      margin-bottom: 4px;
    }

    .section {
      margin-top: 10px;
    }

    .info {
      font-size: 14px;
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 4px;
      text-align: center;
      font-size: 14px;
    }

    th {
      background-color: #f0f0f0;
      font-weight: 600;
    }
.image-container {
  text-align: center;
}
.receipt-image {
  max-height: 1000x;
  max-width: 500px;
  width: auto;
  height: auto;
}

    .vertical-list {
      display: flex;
  flex-direction: column;
      gap: 16px;
      font-size:14px;
      margin-bottom: 8px;
      margin-rgiht:20px;
      list-style-type: none;
      margin: 0;
      padding: 0;
    }

    #footer {
      margin-top: 20px;
      font-size: 13px;
      text-align: center;
      color: #888;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .info-row h3 {
      margin: 0;
      font-size: 16px;
      white-space: nowrap;
    }
  </style>
  <title>Receipt Report</title>
</head>
<body>

  <div id="header">${receipt.description}</div>
  <div class="sub-header">${dayjs(receipt.creation_date).format("YYYY-MM-DD")}</div>

  <div class="section">
    <div class="info"><strong>Typ:</strong> ${receipt.company_card ? "Företagskort" : "Eget Utlägg"}</div>
    <div class="info"><strong>Användare:</strong> ${user.first_name} ${user.surname}</div>
    <div class="info"><strong>Email:</strong> ${user.email}</div>
    <div class="info"><strong>Företag:</strong> ${company.company_name}</div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Beskrivning</th>
          <th>Netto</th>
          <th>Moms</th>
          <th>Belopp</th>
          <th>Belastade företag</th>
          ${receipt.other ? `<th>Övrigt</th>` : ""}
          ${representedHeader}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${dayjs(receipt.receipt_date).format("YYYY-MM-DD")}</td>
          <td>${receipt.description}</td>
          <td>${receipt.net.toFixed(2).replace(".", ",")}</td>
          <td>${receipt.tax.toFixed(2).replace(".", ",")}</td>
          <td>${receipt.total.toFixed(2).replace(".", ",")}</td>
          <td>${chargedCompanies.map((item) =>  item.company_name).join(", ")}</td>
           ${receipt.other ? `<td> ${receipt.other}</td>` : ""}
          ${representedCell}
        </tr>
      </tbody>
    </table>  
    ${representedPage}
  </div>  

 <div class="image-container">
${imagePage}
</div>


</body>
</html>`;
    };

    logger.info(`Building HTML for receipt ID ${id}`);
      
    const html = await createHTML(receipt, chargedCompanies);

    logger.info(`Launching Puppeteer for receipt ID ${id}`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    //Generera pdf buffer
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    logger.info(`PDF successfully generated for receipt ID ${id} `);

    /*const base64 = Buffer.from(pdfBuffer).toString("base64");
    const dataUri = `data:application/pdf;base64,${base64}`;*/
    fs.writeFileSync("test.pdf", pdfBuffer);
    const filename = `${user.first_name}_${user.surname}_${dayjs(receipt.receipt_date).format("YYYY-MM-DD")}_${receipt.description}`;
    return { buf: pdfBuffer, filename: filename };
  } catch (err) {
    logger.error(`Error generating PDF for receipt ID ${id} :`, err);
    throw err;
  }
};

exports.update = async (
  id,
  {
    creation_date,
    receipt_date,
    company_card,
    other,
    net,
    tax,
    image_links,
    description,
    represented,
    charged_companies,
  },
) => {

  try {
 

    await pool.query(
      `UPDATE sigge.receipt 
       SET creation_date='${new Date(creation_date).toLocaleDateString("en-CA")}', receipt_date='${receipt_date}', company_card=${company_card}, net=${net}, tax=${tax}, description='${description}'
       WHERE receipt_id=${id}`,
    );
    logger.info(`Updated receipt ${id}`);

    if (represented !== undefined) {
      await pool.query(
        `DELETE FROM sigge.represented_xref WHERE receipt_id = ${id}`,
        [id],
      );

      if (represented.length > 0) { 
        logger.info(JSON.stringify(represented));
        const repInsertPromises = represented.map((r) =>
         
          pool.query(
            `INSERT INTO sigge.represented_xref (receipt_id, user_name)
             VALUES (${id}, '${r.first_name}')`,
          ),
        );
        await Promise.all(repInsertPromises);
        logger.info(`Updated represented_xref for receipt ${id}`);
      }
    }
       if (image_links !== undefined) {
      
       await pool.query(
        `DELETE FROM sigge.image_xref WHERE receipt_id = ${id}`,
      );

      if (image_links.length > 0) {
       const imageInsertPromises = image_links.map(async (i, index) => {
          return pool.query(
            `INSERT INTO sigge.image_xref ( receipt_id, link, page_number)
             VALUES (${id}, '${i}', ${index + 1})`,
          );
        });

        await Promise.all(imageInsertPromises);
       
      }
        logger.info(`Updated image_xref for receipt ${id}`);
    }
    if (charged_companies !== undefined) {

      await pool.query(
        `DELETE FROM sigge.company_charge_xref WHERE receipt_id = ${id}`,
      );

      if (charged_companies.length > 0) {
        const chargeInsertPromises = charged_companies.map(async (c) => {
          return pool.query(
            `INSERT INTO sigge.company_charge_xref (receipt_id, company_id)
             VALUES (${id}, ${c})`,
          );
        });

        await Promise.all(chargeInsertPromises);
        logger.info(`Updated company_charge_xref for receipt ${id}`);
      }
    }
     if (other !== undefined) {
      await pool.query(
        `DELETE FROM sigge.receipt_other_info WHERE receipt_id = ${id}`,
      );


          return pool.query(
            `INSERT INTO sigge.receipt_other_info (receipt_id, note)
             VALUES (${id}, '${other}')`,
          );
      
         
        
        
      }

 
    await pool.query("COMMIT");
    logger.info(`Successfully committed update for receipt ${id}`);
  } catch (err) {
    await pool.query("ROLLBACK");
    logger.error(`Transaction rolled back while updating receipt ${id}:`, err);
    throw err;
  } finally {

  }
};

exports.remove = async (id) => {
  try {
    await pool.query(
      `DELETE FROM sigge.represented_xref WHERE receipt_id = ${id}`,
    );
    await pool.query(
    `DELETE FROM sigge.company_charge_xref WHERE receipt_id = ${id}`,
    );
    await pool.query(`DELETE FROM sigge.image_xref WHERE receipt_id = ${id}`,
    );
    await pool.query(
      `DELETE FROM sigge.receipt_other_info WHERE receipt_id = ${id}`,
    );
    const result = await pool.query(
      `DELETE FROM sigge.receipt WHERE receipt_id = ${id}`,
    );

    if (result.rowCount === 0) {
      logger.warn(`Receipt with ID ${id} not found for deletion`);
      const error = new Error("Receipt not found");
      error.status = 404;
      throw error;
    }

    logger.info(`Successfully deleted receipt ${id} and associated records`);
  } catch (err) {
    logger.error(`Error deleting receipt ${id}:`, err);
    throw err;
  }
};
