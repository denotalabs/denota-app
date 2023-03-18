import express from "express";

import AWS from "aws-sdk";

import crypto from "crypto";

import multer from "multer";

import lighthouse from "@lighthouse-web3/sdk";

var s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET,
});

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB in bytes
  },
});

const cpUpload = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "document", maxCount: 8 },
]);

app.post("/lighthouse", cpUpload, async function (req, res) {
  const obj = {
    name: "Denota NFT",
  };

  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  try {
    if (req.files.file) {
      const fileContent = req.files.file[0].buffer;
      const response = await lighthouse.uploadBuffer(fileContent, apiKey);

      obj.filename = req.files.file[0].originalname;
      obj.file = response.data.Hash;
    }

    if (req.files.document) {
      const noteContent = JSON.parse(req.files.document[0].buffer.toString());
      if (noteContent.desc) {
        obj.description = noteContent.desc;
      }
      if (noteContent.tags) {
        obj.tags = noteContent.tags.split(",").map((tag) => tag.trim());
      }
    }

    var buf = Buffer.from(JSON.stringify(obj));

    const response = await lighthouse.uploadBuffer(buf, apiKey);

    res.send({
      key: response.data.Hash,
      url: "https://gateway.lighthouse.storage/ipfs/" + response.data.Hash,
    });
  } catch (err) {
    console.error(err);
  }
});

app.post("/", cpUpload, async (req, res) => {
  var obj = {
    name: "Denota NFT",
  };

  if (req.files.file) {
    let fileExt = req.files.file[0].originalname.split(".").slice(-1)[0];

    let fileKey;
    if (["jpg", "jpeg", "png", "gif", "pdf", "docx", "csv"].includes(fileExt)) {
      fileKey = crypto.randomBytes(6).toString("hex") + "." + fileExt;
    } else {
      fileKey = crypto.randomBytes(6).toString("hex");
    }

    const fileContent = req.files.file[0].buffer;
    const params = {
      Bucket: "cheq-nft",
      Key: fileKey,
      Body: fileContent,
      ACL: "public-read",
    };
    const stored = await s3.upload(params).promise();

    obj.filename = req.files.file[0].originalname;
    obj.file = "https://cheq-nft.s3-us-west-2.amazonaws.com/" + fileKey;
  }

  if (req.files.document) {
    const noteContent = JSON.parse(req.files.document[0].buffer.toString());
    obj.description = noteContent.desc;
  }

  var buf = Buffer.from(JSON.stringify(obj));

  const key = crypto.randomBytes(6).toString("hex") + ".json";

  var data = {
    Bucket: "cheq-nft",
    Key: key,
    Body: buf,
    ContentEncoding: "base64",
    ContentType: "application/json",
    ACL: "public-read",
  };

  try {
    const stored = await s3.upload(data).promise();
    res.send({
      url: "https://cheq-nft.s3-us-west-2.amazonaws.com/" + key,
      key,
    });
  } catch (err) {
    console.log(err);
    return undefined;
  }
});

app.listen(3001);