import express from 'express';
import { existsSync } from 'fs';
import path from 'path';

const images = express.Router();

images.get('/', (req, res) => {
  // get the query parameters
  const { filename, width, height } = req.query;

  // construct the image file path
  const imagesDir = path.join(__dirname, '../../../', 'images/full/');
  const image = `${imagesDir + filename}.jpg`;

  // check if there is no query being passed
  if (Object.keys(req.query).length === 0) {
    res.send(
      'specify your image using /api/images?filename=name&width=number&height=number'
    );
    return;
  }

  // serve image file if exists
  if (existsSync(image)) {
    res.sendFile(image);
  } else {
    console.log('Image file does not exists');
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }
});

export default images;
