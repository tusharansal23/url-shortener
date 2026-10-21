require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false })); // parses the POST form body
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory store: short number -> original URL
const urls = [];

app.post('/api/shorturl', function (req, res) {
  const original = req.body.url;

  let parsed;
  try {
    parsed = new URL(original);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Must be http:// or https://
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // The host must actually exist
  dns.lookup(parsed.hostname, function (err) {
    if (err) return res.json({ error: 'invalid url' });

    let index = urls.indexOf(original);
    if (index === -1) {
      urls.push(original);
      index = urls.length - 1;
    }
    res.json({ original_url: original, short_url: index + 1 });
  });
});

app.get('/api/shorturl/:short_url', function (req, res) {
  const original = urls[Number(req.params.short_url) - 1];
  if (!original) {
    return res.json({ error: 'No short URL found for the given input' });
  }
  res.redirect(original);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});