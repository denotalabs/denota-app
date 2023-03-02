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
      user: "your_email@gmail.com",
      pass: "your_password",
    },
  });

  // Create an email object with the HTML content and recipient
  const mailOptions = {
    from: "your_email@gmail.com",
    to: "recipient_email@example.com",
    subject: "Hello from Node.js!",
    html: "<h1>Welcome to my Node.js app!</h1><p>This is an HTML email sent from a Node.js app using Nodemailer and Express.js.</p>",
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
