import Rx from 'rx'

const DOWNLOAD_INTERNAL_URL = 'file://internal/';
const LOCALHOST_URL = 'http://127.0.0.1:9080/';

let fsOpen = (path, flags, ...rest) => {
  let cb = rest[rest.length-1];
  console.log('openDb ...');
  let req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = (evt) => {
    db = evt.target.result;
    console.log('openDb DONE', db);
    cb(false, {db: db, fileName: path});
  };
  req.onerror = (evt) => {
    console.error('openDb:', evt.target.errorCode);
    cb(evt);
  };
  req.onupgradeneeded = (evt) => {
    console.log('openDb.onupgradeneeded');
    let store = evt.currentTarget.result.createObjectStore(
      DB_STORE_NAME, { keyPath: 'fileName', autoIncrement : false });

    store.createIndex('blob', 'blob', { unique: false });
  };
}

let fsWrite = (opt, cb) => {
  console.log('download file')
  let storage = new Storage();

  let successCb = () => {
    console.log('dl success');
    cb(null, {storage: storage, fileName: opt.get('path')});
  }

  let failureCb = (cbObject) => {
    console.log('dl failed');
    cb(cbObject);
  }

  let options = {
    source : opt.get('url'),
    destination : DOWNLOAD_INTERNAL_URL + opt.get('path')
  };
  storage.copyFile(successCb, failureCb, options);
}

let fsRead = (fd, cb) => {
  console.log('fsRead');
  // let cb = rest[rest.length-1];
  let {storage, fileName} = fd;

  // TODO: make cb(err, body)
  // var successCb = function() {
  //   cb(null, LOCALHOST_URL + fileName)
  // }

  // var failureCb = function(cbObject) {
  //   cb(cbObject);
  // }

  let options = {
      source : DOWNLOAD_INTERNAL_URL + fileName,
      destination : LOCALHOST_URL + fileName
  }
  // storage.copyFile(successCb, failureCb, options);
  storage.copyFile(cb, cb, options);
}

let webWrite = Rx.Observable.fromNodeCallback(fsWrite)
let download = (opt) => {
  return webWrite(opt);
}

module.exports = {
  fsOpen: Rx.Observable.fromNodeCallback(fsOpen),
  fsWrite: Rx.Observable.fromNodeCallback(fsWrite),
  fsRead: Rx.Observable.fromNodeCallback(fsRead),
  download
}
