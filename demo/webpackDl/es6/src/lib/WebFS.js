import request from 'request';
import Rx from 'rx';
import WebFS from 'web-fs';

let requestHead = Rx.Observable.fromNodeCallback(request.head, null, _.identity);

let requestBody = (params) => {
  var responseHeaders
  return Rx.Observable.create((observer) => {
    request(params)
      .on('data', buffer => observer.onNext({buffer, headers: responseHeaders}))
      .on('response', x => responseHeaders = x.headers)
      .on('complete', x => observer.onCompleted(x))
      .on('error', x => observer.onError(x))
  })
};

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

var fs = null;

function getFS(cb) {
    if(!fs) {
        navigator.webkitPersistentStorage.requestQuota(1024*1024*1024, function(grantedBytes) {
            window.webkitRequestFileSystem(PERSISTENT, grantedBytes, function(result){
                fs = WebFS(result.root);
                cb(fs);
            });
        });
    } else {
        cb(fs);
    }
}

let fsOpen = (path, flags, ...rest) => {
    let cb = rest[rest.length-1];
    getFS((fs) => {
        cb(false, {fs: fs, path: path});
    });
}

let fsWrite = (ctx, buffer, offset, length, position, cb) => {
    let {fs, path} = ctx;
    fs.write(path, buffer, offset, length, position, cb);
}

let fsTruncate = (ctx, length, cb) => {
    let {fs, path} = ctx;
    fs.truncate(path, length, cb);
}

let fsRename = (from, to, cb) => {
    getFS((fs) => {
        fs.rename(from, to);
    });
}

let fsRead = (path, cb) => {
    getFS((fs) => {
        fs.readFile(path, 'blob', (err, data) => {
            if(err) return cb(err);
            return cb(false, data);
            return cb(false, str2ab(data));
        })
    });
}

module.exports = {
    requestBody,
    requestHead,
    fsOpen: Rx.Observable.fromNodeCallback(fsOpen),
    fsWrite: Rx.Observable.fromNodeCallback(fsWrite),
    fsTruncate: Rx.Observable.fromNodeCallback(fsTruncate),
    fsRename: Rx.Observable.fromNodeCallback(fsRename)
}

module.exports.fsRead = fsRead;
