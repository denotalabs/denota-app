import bodyParser from "body-parser";
import { ethers } from "ethers";
import express from "express";
import nodemailer from "nodemailer";

const app = express();
const port = 6001;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

var jsonParser = bodyParser.json();

const registrar = "0x7338C511171c6cabf35195448921a4dD044fcef6";

app.post("/", jsonParser, async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "denotatest@gmail.com",
        pass: process.env.GMAIL_KEY,
      },
    });

    const { email, txHash, token, amount, isInvoice } = req.body;

    // TODO: handle other chains
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com"
    );

    const tx = await provider.getTransaction(txHash);

    if (tx.to === registrar) {
      const sender = tx.from.slice(0, 5) + "..." + tx.from.slice(-4);

      const notaType = req.body.isInvoice ? "an invoice" : "a payment";

      const notaDescription = isInvoice
        ? `${sender} requests ${amount} ${token}.`
        : `${sender} paid you ${amount} ${token}.`;

      // TODO: add Denota logo/branding
      const mailOptions = {
        from: "denotatest@gmail.com",
        to: email,
        subject: `You received ${notaType}`,
        html: `<h3>Hola from Denota!</h3><p>${notaDescription} Visit app.denota.xyz for more details</p>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          res.status(500).send("Error: " + error);
        } else {
          console.log("Email sent: " + info.response);
          res.send("Email sent!");
        }
      });
    } else {
      res.status(400).send("Wrong contract address");
    }
  } catch (error) {
    res.status(500).send("Error: " + error);
  }
});

app.listen(port, function () {
  console.log("Server listening on port " + port);
});
