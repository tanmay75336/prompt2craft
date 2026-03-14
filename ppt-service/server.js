const express = require("express");
const bodyParser = require("body-parser");
const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());

app.post("/generate-ppt", async (req, res) => {

  const slides = req.body.slides;

  let pptx = new PptxGenJS();

  slides.forEach((s) => {

    let slide = pptx.addSlide();

    slide.addText(s.title, {
      x: 0.5,
      y: 0.5,
      fontSize: 32,
      bold: true
    });

    if (s.bulletPoints) {
      slide.addText(
        s.bulletPoints.map(p => ({ text: "• " + p + "\n" })),
        {
          x: 0.5,
          y: 1.5,
          fontSize: 18
        }
      );
    }

  });

  const filePath = path.join(__dirname, "output.pptx");

  await pptx.writeFile({ fileName: filePath });

  res.download(filePath);

});

app.listen(4000, () => {
  console.log("PPT Service running on port 4000");
});