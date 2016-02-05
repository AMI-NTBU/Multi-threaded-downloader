import Download from './src/app.js';
import {fsRead} from './src/lib/WebFS.js';

let options = {
  strictSSL: false,
    url: 'http://172.16.97.249:3000/static/dl.jpg',
    path: './2a56505d11ce93278ed0937615bdd75f.jpg',
    threadCount: 1
};


let vidOptions = {
    strictSSL: false,
    url: 'http://172.16.97.249:3000/static/vid.mp4',
    path: './vid.mp4',
    threadCount: 1
};

Download.setOb('./lib/WebFS');

getVideo(vidOptions);
getImage(options);

function getImage(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.then(function() {
        fsRead(options.path, function(err, data) {
            if(err) console.log("error reading");
            console.log("read");
            console.dir(data);
            var url = window.URL.createObjectURL(data);
            var img = document.getElementById("picture");
            img.src = url;
        })}, function() {
            console.log("rejected");
            console.dir(arguments);
        });
}

function getVideo(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.then(function() {
        fsRead(options.path, function(err, data) {
            if(err) console.log("error reading");
            console.log("read");
            console.dir(data);
            var url = window.URL.createObjectURL(data);
            var vid = document.getElementById("vid");
            vid.src = url;
            vid.play();
        })}, function() {
            console.log("rejected");
            console.dir(arguments);
        });
}
