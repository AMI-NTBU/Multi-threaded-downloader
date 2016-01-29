//import request from 'request'
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
/*
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
*/
let requestHeadWrapped = (options, cb) => {
  let xhr = new XMLHttpRequest();
  let res = {headers: {}};

  xhr.open('HEAD', options.url);
  xhr.onload = () => {
    res.headers['content-length'] = xhr.getResponseHeader('Content-Length');
    console.log('request head cb', res)
    cb(false, res);
  }
  xhr.onerror = () => {
  }
  xhr.send();
}

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

let fsRead = (path, cb) => {
  if(db) doRead();
  else {
    fsOpen(path, "w+", (e, fd) => {
      if(e) return cb(e);
      else doRead();
    });
  }

  function doRead() {
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

}

// let fsTruncate = () => {
// }

let fsRename = (oldName, newName, cb) => {
  let store = getObjectStore(DB_STORE_NAME, 'readwrite');
  let request = store.get(oldName);
  request.onerror = (evt) => {
    console.error('fsRename:', evt.target.errorCode);
    cb(evt);
  };
  request.onsuccess = (evt) => {
    let data = request.result;

    data.fileName = newName;
    let requestUpdate = store.put(data);
    requestUpdate.onerror = (evt) => {
      console.error('requestUpdate:', evt.target.errorCode);
      cb(evt);
    };
    requestUpdate.onsuccess = (evt) => {
      console.log('fsRename DONE');
      cb(false, evt);
    };
  };
}

supported();

module.exports = {
  //requestBody,
  requestHead: Rx.Observable.fromNodeCallback(requestHeadWrapped, null, _.identity),
  fsOpen: Rx.Observable.fromNodeCallback(fsOpen),
  fsWrite: Rx.Observable.fromNodeCallback(fsWrite),
  // fsTruncate,
  fsRename: Rx.Observable.fromNodeCallback(fsRename)
}
module.exports.fsRead = fsRead;
