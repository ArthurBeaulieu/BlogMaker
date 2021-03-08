const settings = require('./json/identicon.json');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');


/* Utils class to generate identicon */


class identicon {


  constructor(fileName) {
    this._canvas = null;
    this._ctx = null;
    this._color = this._randomColor();

    this._margin = settings.size / 2;
    this._size = (settings.size * settings.blocks) + (this._margin * 2);

    this._init();
    this._genIdenticon();
    this._saveIdenticon(fileName);
  }


  _init() {
    this._canvas = createCanvas(this._size, this._size);
    this._ctx = this._canvas.getContext('2d');
    // Draw identicon background
    this._ctx.beginPath();
    this._ctx.fillStyle = settings.background;
    this._ctx.rect(0, 0, this._size, this._size);
    this._ctx.fill();
    this._ctx.closePath();
  }


  _genIdenticon() {
    for (let i = 0; i < Math.ceil(settings.blocks / 2); ++i) {
      for (let j = 0; j < settings.blocks; ++j) {
        if (Math.random() < 0.5) {
          this._drawRectangle((i * settings.size) + this._margin, (j * settings.size) + this._margin);
          if (i < Math.floor(settings.blocks / 2)) {
            this._drawRectangle((settings.size * settings.blocks) - (this._margin) - (i * settings.size), (j * settings.size) + this._margin);
          }
        }
      }
    }
  }


  _saveIdenticon(fileName) {
    // Extract base64 value via regex before saving to disk
    const b64Image = this._canvas.toDataURL();
    const buffer = new Buffer(b64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    // Build assets/img/avatar if not existing
    if (!fs.existsSync(`${path.join(__dirname, '../../assets/img/avatars/')}`)) {
      fs.mkdirSync(`${path.join(__dirname, '../../assets/img/avatars/')}`, { recursive: true });
    }
    // Saving image to disk as png
    fs.writeFileSync(`${path.join(__dirname, '../../assets/img/avatars/')}${fileName}.png`, buffer);
  }


  _drawRectangle(x, y) {
    this._ctx.beginPath();
    this._ctx.rect(x, y, settings.size, settings.size);
    this._ctx.fillStyle = this._color;
    this._ctx.fill();
    this._ctx.closePath();
  }


  _randomColor() {
    let rgb = [];
    // Iterate over RGB channels to generate random color between settings rgb bounds
    for (let i = 0; i < 3; ++i) {
      const rand = Math.floor(Math.random() * 256); // Gen pseudo random 8 bits value
      const lowBound = Math.max(settings.rgbLowBound, rand); // Cap it according to rgb low bound
      rgb.push(Math.min(settings.rgbHighBound, lowBound)); // Cap it with rgb high bound and push it to rgb array
    }
    // Build rgb output color
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }


}


module.exports = identicon;
