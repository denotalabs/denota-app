import bodyParser from "body-parser";
import express from "express";
import nodemailer from "nodemailer";

const app = express();
const port = 3000;

var jsonParser = bodyParser.json();

app.post("/send-email", jsonParser, async (req, res) => {
  // Create a transport object using the Gmail SMTP server
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "denotatest@gmail.com",
      pass: process.env.GMAIL_KEY,
    },
  });

  // Create an email object with the HTML content and recipient
  const mailOptions = {
    from: "denotatest@gmail.com",
    to: req.body.email,
    subject: "Hola from Denota",
    html: "<h1>You've received a Nota!</h1><p>Visit denota.xyz to view it</p>",
  };

  // Use the transport object to send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.send("Error: " + error);
    } else {
      console.log("Email sent: " + info.response);
      res.send("Email sent!");
    }
  });
});

app.listen(port, function () {
  console.log("Server listening on port " + port);
});
