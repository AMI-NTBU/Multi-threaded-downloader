import request from 'request'
import Rx from 'rx'
import _ from 'lodash'

const DB_NAME = 'downloader';
const DB_VERSION = 1;
const DB_STORE_NAME = 'publications';

let db = 0;
let supported = () => {
  console.log('supported')
  return !!indexedDB;
}

/**
 * @param {string} store_name
 * @param {string} mode either 'readonly' or 'readwrite'
 */
let getObjectStore = (store_name, mode) => {
  let tx = db.transaction(store_name, mode);
  return tx.objectStore(store_name);
}

/**
 * @param {string} fileName
 * @param {Blob=} blob
 */
let addPublication = (db, fileName, blob, cb) => {
  //console.log('addPublication arguments:', arguments);
  let obj = { fileName: fileName, id: 0 };
  if (typeof blob != 'undefined')
    obj.blob = blob;

  let store = getObjectStore(DB_STORE_NAME, 'readwrite');
  let req;
  try {
    req = store.put(obj);
  } catch (e) {
    if (e.name == 'DataCloneError')
      console.error("This engine doesn't know how to clone a Blob, use Firefox");
    return cb(e);
  }
  req.onsuccess = (evt) => {
    console.log('Insertion in DB successful');
    cb(false, evt);
  };
  req.onerror = () => {
    console.error('addPublication error', this.error);
    cb(err);
  };
}

let requestBody = (params) => {
  var responseHeaders
  return Rx.Observable.create((observer) => {
    request(params)
      .on('data', buffer => observer.onNext({buffer, headers: responseHeaders}))
      .on('response', x => responseHeaders = x.headers)
      .on('complete', x => observer.onCompleted(x))
      .on('error', x => observer.onError(x))
  })
}

let requestHeadWrapped = (options, cb) => {
  var x = 3;
  console.dir(options);
  //options.headers = {"Access-Control-Allow-Origin": "*"};

  request.head(options, cb);
}

let requestHead = Rx.Observable.fromNodeCallback(requestHeadWrapped, null, _.identity)

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
    var store = evt.currentTarget.result.createObjectStore(
      DB_STORE_NAME, { keyPath: 'fileName', autoIncrement : false });

    store.createIndex('blob', 'blob', { unique: false });
  };
}

let fsWrite = (ctx, buffer, offset, length, position, cb) => {
  let {db, fileName} = ctx;
  console.log('add ...');

  // put sth here
  addPublication(db, fileName, buffer, (err, evt) => {
    cb(err, evt, ctx);
  });
}

let fsRead = (db, path, cb) => {
  let store = getObjectStore(DB_STORE_NAME, 'readwrite');
  let req = store.get(path);
  console.log("getting " + path);
  req.onsuccess = (evt) => {
    cb(false, evt.target.result, evt);
  }

  req.onerror = (evt) => {
    cb(evt);
  }

}

// let fsTruncate = () => {
// }

// let fsRename = () => {
// }

supported();

module.exports = {
  requestBody,
  requestHead,
  fsOpen: Rx.Observable.fromNodeCallback(fsOpen),
  fsWrite: Rx.Observable.fromNodeCallback(fsWrite),
  // fsTruncate,
  // fsRename
}
module.exports.fsRead = fsRead;
