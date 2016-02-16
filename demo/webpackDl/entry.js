import Download from './src/app.js';

const LOCALHOST_URL = 'http://127.0.0.1:9080/';

let options = {
  strictSSL: false,
    url: 'http://172.16.56.198:3000/static/dl.jpg',//'https://www.google.com/logos/doodles/2016/wilbur-scovilles-151st-birthday-6275288709201920.2-hp.png',//'https://s-media-cache-ak0.pinimg.com/736x/2a/56/50/2a56505d11ce93278ed0937615bdd75f.jpg',
    path: './2a56505d11ce93278ed0937615bdd75f.jpg',
    threadCount: 1
};

let vidOptions = {
    strictSSL: false,
    url: 'http://172.16.56.198:3000/static/vid.mp4',
    path: './vid.mp4',
    threadCount: 1
};

Download.setOb('webos');
getVideo(vidOptions);
getImage(options);

function getImage(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.then(function(ctx) {
        console.log("resolved");

        mtd.fsRead(ctx, e => {
            console.log("got result ");
            var img = document.getElementById("picture");
            img.src = LOCALHOST_URL + ctx.fileName;
        });

    })
    .catch(function(x) {
        console.log("rejected", x);
    });
}

function getVideo(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.then(function(ctx) {
        console.log("resolved");

        mtd.fsRead(ctx, e => {
            console.log("got result ");
            var vid = document.getElementById("vid");
            vid.src = LOCALHOST_URL + ctx.fileName;
            vid.play();
        });

    })
    .catch(function(x) {
        console.log("rejected", x);
    });

}
