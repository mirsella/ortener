const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk = require('monk');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const cors = require('cors')
const enforce = require('express-sslify')
require('dotenv').config();

const db = monk(process.env.MONGODB_URI);
const urls = db.get('urls');
urls.createIndex({ slug: 1 }, { unique: true });
app.use(enforce.HTTPS({ trustProtoHeader: true }))
const app = express();
app.enable('trust proxy');

app.use(helmet());
app.use(morgan('common'));
app.use(cors())
app.use(express.json());
app.use(express.static('./static'));

const notFoundPath = path.join(__dirname, 'static/404/404.html');

app.get('/:id', async (req, res, next) => {
  const { id: slug } = req.params;
  try {
    const url = await urls.findOne({ slug });
    if (url) {
      return res.redirect(url.url);
    }
    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    return res.status(404).sendFile(notFoundPath);
  }
});

const schema = yup.object().shape({
  slug: yup.string().trim().matches(/^[\w\-]+$/i),
  url: yup.string().trim().url().required(),
  passwd: yup.string().trim(),
});

app.post('/url', slowDown({
  windowMs: 10 * 1000,
  delayAfter: 1,
  delayMs: 500,
}), rateLimit({
  windowMs: 20 * 1000,
}), async (req, res, next) => {
  let { slug, url, passwd } = req.body;
  try {
    await schema.validate({
      slug,
      url,
      passwd,
    });
    if (url.includes('ortener.herokuapp.com')) {
      throw new Error('Stop it.');
    }
    if (!slug) {
      slug = nanoid(5);
    } 
    slug = slug.toLowerCase();
    let message = undefined;
    if (passwd) {
      passwd = crypto.createHash('sha256').update(passwd).digest('hex');
    }
    const existing = await urls.findOne({ slug });
    if (existing) {
      if (passwd === existing.passwd || existing.passwd == undefined || passwd === process.env.passwd) {
        message = 'Old slug found, overwriting';
        urls.remove({slug: slug})
      } else {
        throw new Error('Slug in use, Wrong password.');
      }
    }
    const newUrl = {
      url,
      slug,
      passwd,
    };
    const created = await urls.insert(newUrl);
    created['message'] = message;
    res.json(created);

  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  res.status(404).sendFile(notFoundPath);
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? 'not production' : error.stack,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Listening at http://localhost:${process.env.PORT}`);
});
