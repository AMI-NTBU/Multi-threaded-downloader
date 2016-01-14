let Download = require('../src/app');

let options = {
  strictSSL: false,
  url: 'https://s-media-cache-ak0.pinimg.com/736x/2a/56/50/2a56505d11ce93278ed0937615bdd75f.jpg',
  path: './2a56505d11ce93278ed0937615bdd75f.jpg'
 }

Download.setOb('./lib/Observables')
var mtd = new Download(options)
mtd.start();
