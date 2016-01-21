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
let addPublication = (fileName, blob) => {
  console.log('addPublication arguments:', arguments);
  let obj = { fileName: fileName };
  if (typeof blob != 'undefined')
    obj.blob = blob;

  let store = getObjectStore(DB_STORE_NAME, 'readwrite');
  let req;
  try {
    req = store.add(obj);
  } catch (e) {
    if (e.name == 'DataCloneError')
      console.error("This engine doesn't know how to clone a Blob, use Firefox");
    throw e;
  }
  req.onsuccess = (evt) => {
    console.log('Insertion in DB successful');
  };
  req.onerror = () => {
    console.error('addPublication error', this.error);
  };
}

let requestBody = () => {
}

let requestHead = () => {
}

let fsOpen = () => {
  console.log('openDb ...');
  let req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = (evt) => {
    db = this.result;
    console.log('openDb DONE', db);
  };
  req.onerror = (evt) => {
    console.error('openDb:', evt.target.errorCode);
  };
  req.onupgradeneeded = (evt) => {
    console.log('openDb.onupgradeneeded');
    var store = evt.currentTarget.result.createObjectStore(
      DB_STORE_NAME, { keyPath: 'id', autoIncrement : true });

    store.createIndex('fileName', 'fileName', { unique: false });
  };
}

let fsWrite = () => {
  console.log('add ...');

  // put sth here
  addPublication(fileName, blob);
}

let fsTruncate = () => {
}

let fsRename = () => {
}

supported();

module.exports = {
  // requestBody,
  // requestHead,
  fsOpen,
  // fsWrite,
  // fsTruncate,
  // fsRename
}
