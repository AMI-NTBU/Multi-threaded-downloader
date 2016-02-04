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

    s.subscribe((x) => {
      console.log('Next: success!', x);
      mtd.fsRead(x, (e) => {
        let img = document.getElementById('picture');
        img.src = LOCALHOST_URL + x.fileName;
      });
    },
    (err) => {
      console.log('Error: ' + err);
    });

    // s.then(function(ctx) {
    //     let [evt, fd] = ctx;
        // console.log("resolved", ctx);
    //     console.log(ctx)
    //     console.dir(arguments);
    //     fsRead(fd, (e, res, evt) => {
    //         console.log("got result ");
    //         console.dir(res);
    //         console.dir(evt);
    //     //     window.dbresult = res;
    //     //     var url = window.URL.createObjectURL(res.blob);
    //         var img = document.getElementById("picture");
    //         img.src = 'http://127.0.0.1:9080/' + fd.fileName;
    //     });
    // }, function() {
    //     console.log("rejected");
    //     console.dir(arguments);
    // });
}

function getVideo(options) {
    let mtd = new Download(options);
    var s = mtd.startSingle();

    s.subscribe((x) => {
      console.log('Next: success!', x);
      mtd.fsRead(x, (e) => {
        let vid = document.getElementById('vid');
        vid.src = LOCALHOST_URL + x.fileName;
        vid.play();
      });
    },
    (err) => {
      console.log('Error: ' + err);
    });

    // s.then(function(ctx) {
    //     let [evt, fd] = ctx;
    //     console.log("resolved");
    //     console.dir(arguments);
    //     fsRead(fd.db, options.path, (e, res, evt) => {
    //         console.log("got result ");
    //         console.dir(res);
    //         console.dir(evt);
    // //         window.dbresult = res;
    // //         var url = window.URL.createObjectURL(res.blob);
    //         var vid = document.getElementById("vid");
    //         vid.src = 'http://127.0.0.1:9080/' + fd.fileName;
    //         vid.play();
    //     });

    // }, function() {
    //     console.log("rejected");
    //     console.dir(arguments);
    // });
}
