import Download from './src/app.js';

const LOCALHOST_URL = 'http://127.0.0.1:9080/';

let options = {
  strictSSL: false,
    url: 'http://172.16.56.198:3000/static/dl.jpg',//'https://www.google.com/logos/doodles/2016/wilbur-scovilles-151st-birthday-6275288709201920.2-hp.png',//'https://s-media-cache-ak0.pinimg.com/736x/2a/56/50/2a56505d11ce93278ed0937615bdd75f.jpg',
    path: 'file://internal/2a56505d11ce93278ed0937615bdd75f.jpg',
    threadCount: 1
};

let vidOptions = {
    strictSSL: false,
    url: 'http://172.16.56.198:3000/static/vid.mp4',
    path: 'file://internal/test.mp4',
    threadCount: 1
};

Download.setOb('webos');
getVideo(vidOptions);
getImage(options);

function getImage(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.then(ctx => {
        console.log("resolved");

        let fileName = ctx.filePath.split('/');
        mtd.fsRead(ctx, () => {
            var img = document.getElementById("picture");
            img.src = LOCALHOST_URL + fileName[fileName.length-1];
        })
    })
    .catch(x => {
        console.log("rejected", x);
    });
}

function getVideo(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.then(ctx => {
        console.log("resolved");

        let fileName = ctx.filePath.split('/');
        mtd.fsRead(ctx, () => {
            var vid = document.getElementById("vid");
            vid.src = LOCALHOST_URL + fileName[fileName.length-1];
            vid.play();
        })
    })
    .catch(x => {
        console.log("rejected", x);
    });

}
