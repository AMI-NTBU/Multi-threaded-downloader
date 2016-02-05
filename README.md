# mt-downloader [![Build Status](https://travis-ci.org/tusharmath/Multi-threaded-downloader.png?branch=master)](https://travis-ci.org/tusharmath/Multi-threaded-downloader) [![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

This is a nodejs based application which help you in performing downloads via Http. Checkout [tusharm.com](http://tusharm.com/articles/mt-downloader/) to know more about this library.


## Features
1. **Multi threaded downloads:** In a conventional single threaded download you might experience poor performance due to network lags etc. So you don't completely utilize your bandwidth. With multi threads there is always one thread which is getting data thus minimizing the wait period between data packets.

2. **Stop and start from the last downloaded byte:**. You don't have to worry about internet getting disconnected or your computer shutting down while downloading. You can quite easily start from the last byte that was downloaded.

3. **Console application:** If you don't want to use it as a library and want to use it as an application instead we have a console application for you - [mt-console](https://github.com/tusharmath/mtd-console)

4. **Support for browser:** You could choose specific environment, support for webfs/webos/indexedDB single thread download now.

## Installation

The conventional npm installation process needs to be followed. Add this in your `package.json`.

```json
"mt-downloader": "AMI-NTBU/Multi-threaded-downloader#wip/webos"
```

## .mtd file
Once the download starts the library will create a file with a **.mtd** extension. This file contains some meta information related to the download and is a little bigger *(around 10kb)* than the original download size. The **.mtd** file can be used later to restart downloads from where the last byte that was downloaded. After the download is completed the downloader will truncate the file to remove that meta data.

## New-Downloads
When you want to start a new download you just need to provide a download url and a download path and call the ```startSingle()``` method.

```javascript
var mtd = require('mt-downloader');

let options = {
    strictSSL: false,
    url: 'http://172.16.56.198:3000/static/dl.jpg',
    path: './dl.jpg',
    threadCount: 1
};

Download.setOb('webos');
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
```

See it in action [here](https://github.com/AMI-NTBU/Multi-threaded-downloader/blob/wip/webos/demo/webpackDl/es6/entry.js)

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
    path: './dl.jpg'
};
```