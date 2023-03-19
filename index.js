const express = require("express");
const dotenv = require("dotenv");
const bodyParse = require("body-parser");
const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
const allUrl = "https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki";
const characterUrl = "https://kimetsu-no-yaiba.fandom.com/wiki/";
const app = express();
app.use(bodyParse.json({ limit: "100mb" }));
app.use(cors());
dotenv.config();

app.use(
  bodyParse.urlencoded({
    limit: "100mb",
    extended: true,
    parameterLimit: 50000,
  })
);

app.get("/v1", (req, resp) => {
  const thumbnails = [];
  const limit = Number(req.query.limit);
  try {
    axios(allUrl).then((res) => {
      const html = res.data;
      const $ = cheerio.load(html);
      $(".portal", html).each(function () {
        const name = $(this).find("a").attr("title");
        const url = $(this).find("a").attr("href");
        const img = $(this).find("a > img").attr("data-src");
        thumbnails.push({
          name: name,
          url: "http://localhost:8080/v1" + url.split("/wiki")[1],
          img: img,
        });
      });
      if (limit && limit > 0) {
        resp.status(200).json(thumbnails.slice(0, limit));
      } else {
        resp.status(200).json(thumbnails);
      }
    });
  } catch (err) {
    resp.status(500);
  }
});

app.get("/v1/:character", (req, resp) => {
  let url = characterUrl + req.params.character;
  const titles = [];
  const details = [];
  const characters = [];
  const characterObj = {};
  const gallaries = [];
  try {
    axios(url).then((res) => {
      const html = res.data;
      const $ = cheerio.load(html);
      //Get gallery
      $(".wikia-gallery-item", html).each(function () {
        const gallery = $(this).find("a > img").attr("data-src");
        gallaries.push(gallery);
      });

      $("aside", html).each(function () {
        //Get banner img
        const image = $(this).find("img").attr("src");
        //Get the title of character
        $(this)
          .find("section > div > h3")
          .each(function () {
            titles.push($(this).text());
          });
        //Get details of character
        $(this)
          .find("section > div > div")
          .each(function () {
            details.push($(this).text());
          });
        if (image !== undefined) {
          for (let i = 0; i < titles.length; ++i) {
            characterObj[titles[i]] = details[i];
          }
          characters.push({
            name: req.params.character.replace("_", " "),
            gallery: gallaries,
            image: image,
            ...characterObj,
          });
        }
      });
      resp.status(200).json(characters);
    });
  } catch (err) {
    resp.status(200).json(err);
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running");
});
