/* eslint-disable no-undef */
import { File, NFTStorage } from "nft.storage";

import mime from "mime";

import fs from "fs";

import path from "path";

import express from "express";

import bodyParser from "body-parser";

import AWS from "aws-sdk";

import crypto from "crypto";

import multer from "multer";

const upload = multer();

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

var jsonParser = bodyParser.json();

async function storeS3(name, description) {
  var obj = {
    name,
    description,
  };

  var buf = Buffer.from(JSON.stringify(obj));

  const id = crypto.randomBytes(6).toString("hex");

  const key = id + ".json";

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
    return { url: "https://cheq-nft.s3-us-west-2.amazonaws.com/" + key, key };
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

async function storeNFT(name, description) {
  try {
    const image = await fileFromPath("favicon.jpg");

    const nftstorage = new NFTStorage({
      token: process.env.NFT_STORAGE_KEY ?? "",
    });

    const res = await nftstorage.store({
      image,
      name,
      description,
    });
    return { url: res.url, key: res.ipnft };
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

async function fileFromPath(filePath) {
  const content = await fs.promises.readFile(filePath);
  const type = mime.getType(filePath) ?? undefined;
  return new File([content], path.basename(filePath), { type });
}

app.post("/", jsonParser, async function (req, res) {
  if (req.body.mode === "IPFS") {
    const resp = await storeNFT(req.body.name, req.body.description);
    res.send(resp);
  } else {
    const resp = await storeS3(req.body.name, req.body.description);
    res.send(resp);
  }
});

const cpUpload = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "document", maxCount: 8 },
]);

app.post("/upload", cpUpload, async (req, res) => {
  // const fileExt = req.files.file[0].originalname.split(".")[1];

  const fileKey = crypto.randomBytes(6).toString("hex");

  if (req.files.file) {
    const fileContent = req.files.file[0].buffer;
    const params = {
      Bucket: "cheq-nft",
      Key: fileKey,
      Body: fileContent,
      ACL: "public-read",
    };
    const stored = await s3.upload(params).promise();
  }

  var obj = {
    name: "Denota NFT",
  };

  if (req.files.document) {
    const noteContent = JSON.parse(req.files.document[0].buffer.toString());
    obj.description = noteContent.desc;
  }

  if (req.files.file) {
    obj.filename = req.files.file[0].originalname;
    obj.file = "https://cheq-nft.s3-us-west-2.amazonaws.com/" + fileKey;
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
