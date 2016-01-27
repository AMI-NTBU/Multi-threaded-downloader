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

let parseResponseHeaders = (headerStr) => {
  let headers = {'headers': {}};
  if (!headerStr) {
    return headers;
  }
  let headerPairs = headerStr.split('\u000d\u000a');
  for (let i = 0; i < headerPairs.length; i++) {
    let headerPair = headerPairs[i];
    let index = headerPair.indexOf('\u003a\u0020');
    if (index > 0) {
      let key = headerPair.substring(0, index);
      let val = headerPair.substring(index + 2);
      headers.headers[key] = val;
    }
  }
  return headers;
}

let requestBody = (params) => {
  let responseHeaders;

  return Rx.Observable.create((observer) => {
    request(params)
      .on('data', buffer => observer.onNext({buffer, headers: responseHeaders}))
      .on('response', x => responseHeaders = x.headers)
      .on('complete', x => observer.onCompleted(x))
      .on('error', x => observer.onError(x))
  })
}

let requestHeadWrapped = (options, cb) => {
  let xhr = new XMLHttpRequest();

  xhr.open('HEAD', options.url);
  xhr.onload = () => {
    cb(null, parseResponseHeaders(xhr.getAllResponseHeaders()));
  };
  xhr.onerror = () => {
    console.error('error in requestHead');
  };
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
    let store = evt.currentTarget.result.createObjectStore(
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
    let requestUpdate = objectStore.put(data);
    requestUpdate.onerror = (evt) => {
      console.error('requestUpdate:', evt.target.errorCode);
      cb(evt);
    };
    requestUpdate.onsuccess = (evt) => {
      console.log('fsRename DONE');
    };
  };
}

if (!supported()) {
  alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}

module.exports = {
  requestBody,
  requestHead: Rx.Observable.fromNodeCallback(requestHeadWrapped, null, _.identity),
  fsOpen: Rx.Observable.fromNodeCallback(fsOpen),
  fsWrite: Rx.Observable.fromNodeCallback(fsWrite),
  // fsTruncate,
  fsRename
}
module.exports.fsRead = fsRead;
