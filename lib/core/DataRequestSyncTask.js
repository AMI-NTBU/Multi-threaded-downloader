var async = require('async');
var BodyRequest = require('./BodyRequestAsyncTask');
var DownloadWriter = require('./DownloadWriterAsyncTask');
var MetaDataBuilder = require('./MetaDataBuilderSyncTask');
var DownloadTimeout = require('./DownloadTimeoutTask');

var Task = function(metaData, headRequest, fd, options) { // threads, url, fd, fileSize, options) {
	//this.metaData = metaData;
	this.threads = metaData.threads;
	this.url = metaData.url;
	this.port = metaData.port;
	this.method = metaData.method;
	this.fd = fd;
	this.headRequest = headRequest;

	this.fileSize = metaData.downloadSize;

	this.options = options || {};
	this.timeout = options.timeout;
};

var _execute = function() {
	var self = this;

	var timeout = new DownloadTimeout(self.threads, {
		timeout: self.timeout
	});

	timeout.callback = function() {
		throw 'Download request timed out';
	};
	timeout.execute();

	//console.log('starting data req with', this.callback);

	async.each(self.threads, function(item, callback) {

		//console.log('on thread', item);
		item.callback = callback;
		async.waterfall([

		//Make Body request


		function(callback) {

			var req = new BodyRequest(self.url, item.header, function(dataChunk) {
				//console.log(dataChunk.length);
				callback(null, dataChunk, item);
			}, {
				port: self.port,
				method: self.method
			});

			req.callback = function() {
				//console.log('Thread end');
				item.connection = 'closed';
				self.options.onThreadChange(self.threads);
				//item.callback();
			};

			req.execute();
		},


		//On Data Recieved

		function(dataChunk, thread, callback) {
			var writer = new DownloadWriter(self.fd);

			var executerArgs = {
				data: dataChunk,
				position: item.position
			};

			writer.callback = function(bytes) {
				callback(null, bytes, thread);
			};

			writer.execute(executerArgs);

			//console.log('Writing on:', thread.position, '+', dataChunk.length, '=', thread.position + bytes);
			thread.position += dataChunk.length;
			if (thread.connection === 'closed') {
				//console.log(self.threads);
				if (thread.position != thread.end) {
					thread.connection = 'failed';
				}
				thread.callback();
			}
			callback();
			self.options.onThreadChange(self.threads);
		},

		//Generate Meta Data

		function(callback) {
			var builder = new MetaDataBuilder(self.threads, {
				fileSize: self.fileSize
			}, self.fd, {
				url: self.url
			});
			builder.callback = function(response) {
				callback(null, response);
			};
		},

		//Write Meta Data

		function(response, position, callback) {
			var writer = new DownloadWriter(self.fd);
			writer.callback = function(bytes) {
				callback(null, bytes);
			};
			writer.execute(response, position);

		}


		]);


	}, function() {
		timeout.stop();
		self.callback();
	});
};

Task.prototype.execute = _execute;



module.exports = Task;