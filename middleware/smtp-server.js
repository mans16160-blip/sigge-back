const { SMTPServer } = require("smtp-server");
const fs = require("fs");
const { defaultArgs } = require("puppeteer");
var nodemailer = require("nodemailer");
const smtp = new SMTPServer({
  secure: true,
  key: fs.readFileSync("/etc/letsencrypt/live/siggemzenon.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/siggemzenon.com/fullchain.pem"),
  authOptional: false,

  // 🔐 Log authentication attempts
  onAuth(auth, session, callback) {
    console.log(
      `🔐 AUTH attempt - Username: ${auth.username}, IP: ${session.remoteAddress}`,
    );
    if (auth.username === "keycloak" && auth.password === "supersecure") {
      console.log("✅ Auth successful");
      return callback(null, { user: auth.username });
    } else {
      console.log("❌ Auth failed");
      return callback(new Error("Invalid credentials"));
    }
  },

  // 📩 Log incoming email details
  onData(stream, session, callback) {
    let data = "";
    stream.on("data", (chunk) => (data += chunk));
    stream.on("end", () => {
      console.log("📤 From:", session.envelope.mailFrom.address);
      console.log(
        "📥 To:",
        session.envelope.rcptTo.map((r) => r.address).join(", "),
      );

      console.log("📝 Message content:\n", data);
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "msigge171@gmail.com",
          pass: "dciw wmug pxnj zrrk",
        },
      });
      var mailOptions = {
        to: session.envelope.rcptTo.map((r) => r.address).join(", "), // emails.map((item) => item + ", "),
        subject: `password reset`,
        text: data,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Mail");
        }
      });
      callback(null);
    });
  },

  // 🔌 Log connection info
  onConnect(session, callback) {
    console.log(`🔌 Connection from ${session.remoteAddress}`);
    callback(); // accept all connections
  },
});

module.exports = smtp;
