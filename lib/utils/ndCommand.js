#!/usr/bin/env node

var program = require('commander');
var core = require('../core');

function range(val) {
  return val.split('..').map(Number);
}

function list(val) {
  return val.split(',');
}

program
  .version('0.0.1')
  .usage('test')
  .option('-t, --threadCount <n>', 'Total number of threads', parseInt)
  .option('-p, --path <path>', 'Save file to.')
  .option('-u, --url <path>', 'Download file from')
  .parse(process.argv);

//return;
var donwloader = new core(program);
donwloader.download();