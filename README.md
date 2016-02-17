# mt-downloader [![Build Status](https://travis-ci.org/tusharmath/Multi-threaded-downloader.png?branch=master)](https://travis-ci.org/tusharmath/Multi-threaded-downloader) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Modifying [Multi-threaded-downloader](https://github.com/tusharmath/Multi-threaded-downloader) to support for browser/WebOS. But only single thread download now.


## Features
 - **Support for browser:** You could choose specific environment, support for webfs/webos/indexedDB single thread download now.

## Installation

The conventional npm installation process needs to be followed. Add this in your `package.json`.

```json
"mt-downloader": "AMI-NTBU/Multi-threaded-downloader#wip/webos"
```

## New-Downloads
When you want to start a new download you just need to provide a download url and a download path and call the ```startSingle()``` method.

```javascript
var mtd = require('mt-downloader');

let options = {
    strictSSL: false,
    url: 'http://172.16.56.198:3000/static/dl.jpg',
    path: 'file://internal/2a56505d11ce93278ed0937615bdd75f.jpg',
    threadCount: 1
};

Download.setOb('webos');
let mtd = new Download(options);
var s = mtd.startSingle();
    s.then((ctx) => {
        console.log("resolved");

        mtd.fsRead(ctx, e => {
            console.log("got result ");
            var img = document.getElementById("picture");
            img.src = LOCALHOST_URL + ctx.fileName;
        });

    })
    .catch((x)  => {
        console.log("rejected", x);
    });
```

See it in action [here](https://github.com/AMI-NTBU/Multi-threaded-downloader/tree/wip/indexedDB/demo/webpackDl)

## APIs

 - **setOb:** environment setting, set before constructor.
    - `Download.setOb('webos')` Options are 'indexeddb', 'webfs' and 'webos'.
    - [example](https://github.com/AMI-NTBU/Multi-threaded-downloader/blob/wip/webos/demo/webpackDl/entry.js#L19)
 - **download:** new object
    - `new Download(options)` Options see  [Download Options](https://github.com/AMI-NTBU/Multi-threaded-downloader/tree/wip/webos#download-options).
    - [example](https://github.com/AMI-NTBU/Multi-threaded-downloader/blob/wip/webos/demo/webpackDl/entry.js#L24)
 - **startSingle:** to start single donwload.
    - `mtd.startSingle()`
    - [example](https://github.com/AMI-NTBU/Multi-threaded-downloader/blob/wip/webos/demo/webpackDl/entry.js#L25)
 - **fsRead:** read data
    - `mtd.fsRead(ctx, callback)` ctx is an object `{storage, filePath}`
    - [example](https://github.com/AMI-NTBU/Multi-threaded-downloader/blob/wip/webos/demo/webpackDl/entry.js#L31)

## Download Options
A set of custom options can be sent to control the way a download is performed.

```javascript
var options = {
    // To set the total number of download threads
    threadCount: 2, //(Default: 3)

    // To set custom headers, such as cookies etc.
    headers: {},

    //To set the SSL property
    strictSSL: false,

    // To set the remote server
    url: 'http://172.16.56.198:3000/static/dl.jpg',

    // To  set the location the file paste after download
    path: 'file://internal/2a56505d11ce93278ed0937615bdd75f.jpg'
};
```
