var webfs = require("../dist/lib/WebFS.js");
var Rx = require("rx");

if(window.webkitRequestFileSystem) {

	describe("WebFS lib test", function() {
	    var fileName = "/file.txt";
	    var testBuffer = "this is a test buffer!";
	    var file = webfs.fsOpen(fileName, "rw");

	    it("should open the WebFS instance successfully", function(done) {
	        file.subscribe(function(context) {
	            console.log("CB!!!");
	            ctx = context;
	            expect(ctx).toBeDefined();
	            expect(ctx.fs).toBeDefined();
	            expect(ctx.path).toBeDefined();
	            done();
	        }, function(e) {
	            fail(e);
	            done();
	        });
	    });

	    it("should write to webfs", function(done) {
	        file.flatMap(function(ctx) {
	            return webfs.fsWrite(ctx, testBuffer, 0, testBuffer.length, 0);
	        }).subscribe(function(evt, ctx) {
	            console.log("wrote it");
	            done();
	        }, function(e) {
	            fail(e);
	            done();
	        });
	    });

	    it("should read data that have been written", function(done) {
	        file.flatMap(function(ctx) {
	            //TODO: make fsRead an rx stream?
	            return Rx.Observable.fromNodeCallback(webfs.fsRead)(fileName, 'utf8');
	        }).subscribe(function(res) {
	            console.dir(res);
	            expect(res).toEqual(testBuffer);
	            done();
	        }, function(e) {
	            fail(e);
	            done();
	        });
	    });

	    it("should rename files", function(done) {
	        var newName = "/something_else.txt";
	        webfs.fsRename(fileName, newName)
	            .zip(webfs.fsOpen(newName, "rw"))
	            .flatMap(function(r, ctx) {
	                return Rx.Observable.fromNodeCallback(webfs.fsRead)(newName, 'utf8');
	            }).subscribe(function(res) {
	                console.dir(res);
	                expect(res).toEqual(testBuffer);
	                done();
	            }, function(e) {
	                fail(e);
	                done();
	            });
    	});

    	//TODO: truncate

	});
} else {
	console.log("Skipping webfs test, this browser doesn't support sandboxed fs.");
}