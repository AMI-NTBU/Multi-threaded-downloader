/**
 * Created by tusharmathur on 5/15/15.
 */
'use strict'

var _ = require('lodash')
var utils = require('./lib/Utility')
var ob
const {fromJS} = require('immutable')
const {map, times, identity} = _
const MAX_BUFFER = 512

var defaultOptions = {
  headers: {},
  threadCount: 3,
  strictSSL: true
}

var getContentLength = (res) => res.headers['content-length'] ?  parseInt(res.headers['content-length'], 10) :  parseInt(res.headers['Content-Length'], 10)
var rangeHeader = (thread) => ({'range': `bytes=${thread.start}-${thread.end}`})
var toBuffer = _.partialRight(utils.toBuffer, MAX_BUFFER)

function drawImage(srcURI) {
  console.log("IMAGE URI : " + srcURI);
  console.log("Open file : " + srcURI);

  var drawImage_SuccessCb = function(cbObject) {
    console.log("Image read success : " + cbObject.data.byteLength + " Bytes");
    console.log("Load image : " + srcURI);
    console.log(cbObject.data);
    var binary_data = [];
    var chararray = [];

    // Get Binary Data
    var dataView = new DataView(cbObject.data);
    // Encode binary to base64

    for (var i = 0; i < cbObject.data.byteLength; i++) {
      binary_data[i] = ("00" + dataView.getUint8(i).toString(16)).substr(-2).toUpperCase();
      chararray[i] = String.fromCharCode(parseInt(binary_data[i], 16)).toString('base64');
    }
    var data_base64 = btoa(chararray.join(""));

    // Draw image
    var imageSrc = document.getElementById('picture');
    imageSrc.src = "data:image/jpeg;base64, " + data_base64.toString();
  }

  var drawImage_FailureCb = function(cbObject) {
    console.log("Failed to load image - Path : " + srcURI);
    console.log(JSON.stringify(cbObject));

    var errorCode = cbObject.errorCode;
    var errorText = cbObject.errorText;
    var errorMessage = "Error Code [" + errorCode + "]: " + errorText;
    console.log(errorMessage);
  }

  var drawImage_option = {
    path : srcURI,
    positon : 0,
    encoding: 'binary'
  };

  var storage = new Storage();
  storage.readFile(drawImage_SuccessCb, drawImage_FailureCb, drawImage_option);
}

function singleThreadDownload(options) {
  console.log('singleThreadDownload')
  const opt = fromJS(options)
  console.log(options)

  const DOWNLOAD_INTERNAL_URL = 'file://internal/' + opt.get('path');

  let opts = {
    file : DOWNLOAD_INTERNAL_URL
  };

  let storage = new Storage();
  storage.removeFile(successCallback, errorCallback, opts);

  function successCallback(cbObject) {
    console.log('fsOpen successCallback');
  }

  function errorCallback(cbObject) {
    let errorCode = cbObject.errorCode,
        errorText = cbObject.errorText;
    console.log("Error Code [" + errorCode + "]: " + errorText);
  }

  console.log('downloadFile')
  console.log('getFileInfo', opt.get('url'))
  var req = new XMLHttpRequest();
  req.open('GET', opt.get('url'), false);
  req.send(null);
  let TOTAL_FILE_SIZE = parseInt(req.getResponseHeader('content-length'));
  console.log("File Size : " + TOTAL_FILE_SIZE);

  var downloadOptions = {
    source : opt.get('url'),
    destination : DOWNLOAD_INTERNAL_URL
  };

  storage.copyFile(successCb, failureCb, downloadOptions);

  function successCb() {
    console.log('dl success')
    drawImage(DOWNLOAD_INTERNAL_URL)
  }

  function failureCb() {
    console.log('dl failed')
  }
}

function download (options) {
  console.log(options)
  const opt = fromJS(options)
  console.log(opt)
  var writePositions = fromJS(times(opt.get('threadCount'), 0))
  const writableFile = ob.fsOpen(opt.get('path'), 'w+')
  const downloadSize = ob.requestHead(opt.filter(utils.keyIn(['url', 'strictSSL'])).toJS()).map(getContentLength).filter(_.isFinite)

  return downloadSize.combineLatest(writableFile, (size, fd) => opt.set('size', size).set('fd', fd))
    .map(x => x.set('threads', fromJS(utils.sliceRange(x.get('threadCount'), x.get('size')))))
    .flatMap(x => map(x.get('threads').toJS(), (thread, i) => x.set('headers', fromJS(rangeHeader(thread))).set('threadIndex', i).set('start', thread.start)))
    .tap(x => writePositions = writePositions.set(x.get('threadIndex'), x.get('start')))
    .flatMap(x => ob.requestBody(x.filter(utils.keyIn(['url', 'strictSSL', 'headers'])).toJS()), (x, data) => x.set('buffer', data.buffer))
    .tap(x => {
      var i = x.get('threadIndex')
      writePositions = writePositions.set(i, writePositions.get(i) + x.get('buffer').length)
    })
    .map(x => x.set('writtenPositions', writePositions))
    .flatMap(x => ob.fsWrite(x.get('fd'), x.get('buffer'), 0, x.get('buffer').length, x.get('writtenPositions').get(x.get('threadIndex')) - x.get('buffer').length), identity)
    .map(x => x.set('metaBuffer', toBuffer(x.filter(utils.keyIn(['fd', 'url', 'writtenPositions', 'path', 'size', 'threads'])).toJS())))
    .flatMap(x => ob.fsWrite(x.get('fd'), x.get('metaBuffer'), 0, x.get('metaBuffer').length, x.get('size')), identity)
    .last()
    .flatMap(x => ob.fsTruncate(x.get('fd'), x.get('size')), identity)
    .flatMap(x => ob.fsRename(x.get('path'), x.get('path').replace('.mtd', '')), identity)
}

class Download {
  constructor (options) {
    console.log('Donwload constructor')
    if (ob === undefined) {
      throw new Error('Need to set ob library!');
    }
    this.options = _.defaults(options, defaultOptions)
    this.options.path += '.mtd';
  }

  static setOb (b) {
    console.log('setOb')
    if(typeof b === "string") {
      b = b.toLowerCase();
      switch(b) {
        case "indexeddb":
          ob = require("./lib/IndexedDB");
          break;
        case "webfs":
          ob = require("./lib/WebFS");
          break;
        case "webos":
          ob = require("./lib/WebOS");
          break;
        case "observables":
          ob = require("./lib/Observables");
          break;
        default:
          console.error("Invalid Observable library!");
      }
      return;
    } else if(typeof b === 'object') {
      ob = b;
    }
  }

  start () {
    console.log('start')
    let d = download(this.options);
    return d.toPromise();
  }

  startSingle() {
    console.log('start')
    this.options.path = this.options.path.slice(0,-4); //remove .mtd
    let d = singleThreadDownload(this.options);
    // return d.toPromise();
    return d;
  }

  stop () {
  }
}

module.exports = Download
