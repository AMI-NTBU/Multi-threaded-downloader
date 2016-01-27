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

var getContentLength = (res) => parseInt(res.headers['content-length'], 10)
var rangeHeader = (thread) => ({'range': `bytes=${thread.start}-${thread.end}`})
var toBuffer = _.partialRight(utils.toBuffer, MAX_BUFFER)

function singleThreadDownload(options) {
  const opt = fromJS(options)
  const writableFile = ob.fsOpen(opt.get('path'), 'w+')
  const downloadedFile = Rx.Observable.create(observer => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", options.url);
    xhr.onload = () => {
      observer.onNext(xhr.response);
      observer.onCompleted();
    }
    xhr.onerror = () => {
      observer.onError(xhr);
    }
    xhr.responseType = "blob";
    xhr.send();
  });

  return writableFile
    .zip(downloadedFile, (fd, buffer) => _.merge(options, {fd: fd, buffer: buffer}))
    .flatMap(ctx => {
      return ob.fsWrite(ctx.fd, ctx.buffer, 0, ctx.buffer.length, 0)
    });
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
        .last().do((x)=>{console.log("complete")})
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
        default:
          console.error("Invalid Observable library!");
      }
      return;
    } else if(typeof b === 'function') {
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
    return d.toPromise();
  }

  fsRead(path, cb) {
    ob.fsRead(path, cb);
  }

  stop () {
  }
}

module.exports = Download
