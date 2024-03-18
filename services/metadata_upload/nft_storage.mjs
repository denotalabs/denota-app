import express from "express";

import multer from "multer";

import lighthouse from "@lighthouse-web3/sdk";

import imageType from "image-type";

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

      const type = await imageType(fileContent);
      const isImage = !!type;
      if (isImage) {
        obj.image = "ipfs://" + response.data.Hash;
      }
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
      imageURI: obj.image ?? "",
      url: "https://gateway.lighthouse.storage/ipfs/" + response.data.Hash,
    });
  } catch (err) {
    console.error(err);
  }
});

app.listen(3001);
