import Rx from 'rx'

const LOCALHOST_URL = 'http://127.0.0.1:9080/';

let fsWrite = (opt, cb) => {
  let storage = new Storage();

  let successCb = () => {
    cb(null, {storage: storage, filePath: opt.get('path')});
  }

  let failureCb = (cbObject) => {
    cb(cbObject);
  }

  let options = {
    source : opt.get('url'),
    destination : opt.get('path'),
    maxRedirection: 5
  };
  storage.copyFile(successCb, failureCb, options);
}

let fsRead = (fd, cb) => {
  console.log('fsRead');
  // let cb = rest[rest.length-1];
  let {storage, filePath} = fd;
  let fileName = filePath.split('/');

  // TODO: make cb(err, body)
  // var successCb = function() {
  //   cb(null, LOCALHOST_URL + fileName)
  // }

  // var failureCb = function(cbObject) {
  //   cb(cbObject);
  // }

  let options = {
      source : filePath,
      destination : LOCALHOST_URL + fileName[fileName.length-1]
  }
  // storage.copyFile(successCb, failureCb, options);
  storage.copyFile(cb, cb, options);
}

let webWrite = Rx.Observable.fromNodeCallback(fsWrite)
let download = (opt) => {
  return webWrite(opt);
}

module.exports = {
  fsRead,
  download
}
