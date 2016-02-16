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
  console.log('requestBody')
  let responseHeaders;

  return Rx.Observable.create((observer) => {
    let xhr = new XMLHttpRequest();

    xhr.open('GET', params.url);
    // xhr.setRequestHeader('Range', params.headers.range);
    xhr.onload = () => {
      let buffer = xhr.response;
      let responseHeaders = parseResponseHeaders(xhr.getAllResponseHeaders());

      console.log(buffer)
      observer.onNext({buffer, headers: responseHeaders})
    };
    xhr.onloadend = () => {
      observer.onCompleted();
    };
    xhr.onerror = (e) => {
      observer.onError(e);
    };
    xhr.responseType = 'blob';
    xhr.send();
  });
}

let requestHeadWrapped = (options, cb) => {
  console.log('requestHeadWrapped')
  let xhr = new XMLHttpRequest();

  xhr.open('HEAD', options.url);
  xhr.onload = () => {
    cb(null, parseResponseHeaders(xhr.getAllResponseHeaders()));
  };
  xhr.onerror = (e) => {
    console.error('error in requestHead', e);
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

// let fsTruncate = (ctx, len, callback) => {
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
    };
  };
}
let requestHead = Rx.Observable.fromNodeCallback(requestHeadWrapped)
let dbOpen = Rx.Observable.fromNodeCallback(fsOpen)
let dbWrite = Rx.Observable.fromNodeCallback(fsWrite)

const utils = require('./Utility')
const {fromJS} = require('immutable')
const {map, times, identity} = _
const MAX_BUFFER = 512

let getContentLength = (res) => res.headers['content-length'] ?  parseInt(res.headers['content-length'], 10) :  parseInt(res.headers['Content-Length'], 10)
let rangeHeader = (thread) => ({'range': `bytes=${thread.start}-${thread.end}`})
let toBuffer = _.partialRight(utils.toBuffer, MAX_BUFFER)
let download = (opt) => {
  console.log('download')
  let writePositions = fromJS(times(opt.get('threadCount'), 0))
  const writableFile = dbOpen(opt.get('path'), 'w+');
  const downloadSize = requestHead(opt.filter(utils.keyIn(['url', 'strictSSL'])).toJS()).map(getContentLength).filter(_.isFinite)

  return downloadSize.combineLatest(writableFile, (size, fd) => opt.set('size', size).set('fd', fd))
    .map(x => x.set('threads', fromJS(utils.sliceRange(x.get('threadCount'), x.get('size')))))
    .flatMap(x => map(x.get('threads').toJS(), (thread, i) => x.set('headers', fromJS(rangeHeader(thread))).set('threadIndex', i).set('start', thread.start)))
    .tap(x => writePositions = writePositions.set(x.get('threadIndex'), x.get('start')))
    .flatMap(x => requestBody(x.filter(utils.keyIn(['url', 'strictSSL', 'headers'])).toJS()), (x, data) => x.set('buffer', data.buffer))
    .tap(x => {
      var i = x.get('threadIndex')
      writePositions = writePositions.set(i, writePositions.get(i) + x.get('buffer').size)
    })
    .map(x => x.set('writtenPositions', writePositions))
    .flatMap(x => dbWrite(x.get('fd'), x.get('buffer'), 0, x.get('buffer').size, x.get('writtenPositions').get(x.get('threadIndex')) - x.get('buffer').size), identity)
    .map(x => x.set('metaBuffer', toBuffer(x.filter(utils.keyIn(['fd', 'url', 'writtenPositions', 'path', 'size', 'threads'])).toJS())))
    // .flatMap(x => ob.fsWrite(x.get('fd'), x.get('metaBuffer'), 0, x.get('metaBuffer').length, x.get('size')), identity)
    .last()
    // .flatMap(x => ob.fsTruncate(x.get('fd'), x.get('size')), identity)
    // .flatMap(x => ob.fsRename(x.get('path'), x.get('path').replace('.mtd', '')), identity)
}

if (!supported()) {
  alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}

module.exports = {
  requestBody,
  requestHead,
  fsOpen: Rx.Observable.fromNodeCallback(fsOpen),
  fsWrite: Rx.Observable.fromNodeCallback(fsWrite),
  // fsTruncate,
  fsRename,
  fsRead,
  download
}
