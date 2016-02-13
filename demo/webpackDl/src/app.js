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

function singleThreadDownload(options) {
  console.log('singleThreadDownload')
  const opt = fromJS(options)

  return ob.download(opt).toPromise();
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
    console.log('setOb', b)
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
        // case "observables":
        //   ob = require("./lib/Observables");
        //   break;
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
    //return d.toPromise();
    return d;
  }

  stop () {
  }

  fsRead(path, cb) {
    ob.fsRead(path, cb);
  }


}

module.exports = Download
