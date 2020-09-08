require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const Twit = require('twit');

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const access_token = process.env.ACCESS_TOKEN;
const access_token_secret = process.env.ACCESS_TOKEN_SECRET;

const bot = new Twit({
  consumer_key,
  consumer_secret,
  access_token,
  access_token_secret,
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    'https://en.wikipedia.org/wiki/Special:RandomInCategory/Category:Premier_League_players'
  );
  const element = await page.$('tbody');

  // Screenshot the answer instead of providing link
  console.log(page.url());
  await element.screenshot({ path: 'answer.png' });
  /*
    Removing original answer method. Was printing Wikipedia URL to a .txt file
  */
  // const url = await page.url();
  // let pageData = await url;
  // await fs.writeFileSync('player.txt', pageData, err => {
  //   if (err) throw err;
  // });

  await page.evaluate(() => {
    try {
      if (document.contains(document.querySelector('.box-Tone'))) {
        document.querySelector('.box-Tone').remove();
      }
      if (document.contains(document.querySelector('.box-Expand_language'))) {
        let languageBox = document.querySelectorAll('.box-Expand_language');
        if (languageBox.length > 1) {
          let languageBoxes = Array.from(languageBox);
          languageBoxes.map((box) => box.remove());
        } else {
          languageBox.remove();
        }
      }
      let img = document.querySelector('.image');
      let nickname = document.querySelector('.nickname');
      let age = document.querySelector('.ForceAgeToShow');
      let bplace = document.querySelector('.birthplace');
      let role = document.querySelector('.role');
      let org = document.querySelector('.org');
      if (img) img.parentNode.remove();
      if (nickname) nickname.parentNode.remove();
      age.parentNode.parentNode.remove();

      bplace.parentNode.nextSibling.remove();
      bplace.parentNode.remove();

      role.parentNode.remove();

      if (org.parentNode.nextSibling) org.parentNode.nextSibling.remove();
      if (org) org.parentNode.remove();

      let birthname = document.querySelector('.nickname');
      if (birthname) {
        birthname.parentNode.remove();
      }
      let fullname = document.querySelector('.fn');
      fullname.remove();
    } catch (err) {
      console.log(err);
    }
  });
  await element.screenshot({ path: 'player.png' });
  await browser.close();
  postPlayer();
  setTimeout(postAnswer, 18000000);
})();

function postPlayer() {
  let b64content = fs.readFileSync('./player.png', { encoding: 'base64' });
  bot.post('media/upload', { media_data: b64content }, function (
    err,
    data,
    response
  ) {
    let mediaIdStr = data.media_id_string;
    let altText = "Unknown footballer's statistics and information.";
    let meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

    bot.post('media/metadata/create', meta_params, function (
      err,
      data,
      response
    ) {
      if (!err) {
        let params = {
          status: 'Guess that player #footballtrivia #PremierLeague',
          media_ids: [mediaIdStr],
        };
        bot.post('statuses/update', params, function (err, data, response) {
          console.log(data);
        });
      }
    });
  });
}

function postAnswer() {
  let b64answer = fs.readFileSync('./answer.png', { encoding: 'base64' });
  bot.post('media/upload', { media_data: b64answer }, function (
    err,
    data,
    response
  ) {
    let mediaIdStr = data.media_id_string;
    let altText = 'Answer';
    let meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

    bot.post('media/metadata/create', meta_params, function (
      err,
      data,
      response
    ) {
      if (!err) {
        let params = {
          status: `Today's answer #footballtrivia #PremierLeague`,
          media_ids: [mediaIdStr],
        };
        bot.post('statuses/update', params, function (err, data, response) {
          console.log(data);
        });
      }
    });
  });
}
