const receiptService = require("../services/receiptService");
const { pool } = require("../db");
const nodemailer = require("nodemailer");
const axios = require("axios");
const logger = require("../logger");
const { getAdminToken } = require("./authController");

async function generateAndEmailDailyReports() {
  const today = new Date().toISOString().split("T")[0];
  const ignoreUsers = [
    "fa492f11-07ed-484f-adff-41a5835c0e7e",
    "cbe66f8f-a1fa-4950-a309-9b1c24bc87ce",
  ];
  console.log(today)
  const receiptData = await pool.query(
    `SELECT * FROM sigge.receipt WHERE creation_date = '${today}' AND user_id != '${ignoreUsers[0]}' AND user_id != '${ignoreUsers[1]}'`,
  );

  const pdfBuffers = [];
  const receipts = receiptData[0];


  //Gör rapporterna till PDF
  for (const receipt of receipts) {
    try {
      let pdf = await receiptService.generatePDF(receipt.receipt_id);

      if (
        typeof pdf === "string" &&
        pdf.startsWith("data:application/pdf;base64,")
      ) {
        const base64Data = pdf.replace(/^data:application\/pdf;base64,/, "");
        pdf = Buffer.from(base64Data, "base64");
      }
      const userData = await pool.query(
        `SELECT * FROM sigge.user WHERE user_id = '${receipt.user_id}'`
      );
    
      const username = userData[0][0].first_name + "-" + userData[0][0].surname;

      pdfBuffers.push({ buf: pdf, receipt: receipt, user: username });
    } catch (err) {
      console.warn(
        `Failed to generate PDF for receipt ${receipt.receipt_id}: ${err.message}`,
      );
    }
  }

  if (pdfBuffers.length > 0) {
    try {
      const adminEmails = await getAdminEmailsFromKeycloak(); //Hämta admins email
      //console.log(JSON.stringify(pdfBuffers))
      for (const email of adminEmails) {
        await sendEmailWithAttachments(pdfBuffers, email); //Skicka mail med PDF
        logger.info(`Sent ${pdfBuffers.length} PDFs to ${email}`);
      }
    } catch (err) {
      logger.error(`Failed to send emails to admins: ${err.message}`);
    }
  } else {
    logger.info("No receipts for today");
  }
}

async function getAdminEmailsFromKeycloak() {
  const token = await getAdminToken();

  const response = await axios.get(
    `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/admin/users`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data.filter((user) => user.email).map((user) => user.email);
}

async function sendEmailWithAttachments(pdfs, email) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const nameCount = {};
  const attachments = pdfs.map((pdf, i) => {
    logger.info(pdf.user)
    const baseName = `${pdf.user}_${pdf.receipt.receipt_date.toISOString().split("T")[0]}_${pdf.receipt.description}`;
  
    nameCount[baseName] = (nameCount[baseName] || 0) + 1;

    const suffix = nameCount[baseName] > 1 ? `#${nameCount[baseName]}` : "";
    const filename = `${baseName}${suffix}.pdf`;

    return {
      filename,
      content: pdf.buf.buf,
    };
  });
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Dagilga rapporter",
    text: "Här är dagens rapporter.",
    attachments,
  });
}

module.exports = { generateAndEmailDailyReports };
