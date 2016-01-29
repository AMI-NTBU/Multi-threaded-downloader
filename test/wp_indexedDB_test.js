var idb = require("../dist/lib/IndexedDB.js");
var Rx = require("rx");

describe("IndexedDB lib test", function() {
    var ctx;
    var fileName = "/file.txt";
    var testBuffer = "this is a test buffer!";
    var file = idb.fsOpen(fileName, "rw");

    it("should open the indexedDB instance successfully", function(done) {
        file.subscribe(function(context) {
            console.log("CB!!!");
            ctx = context;
            expect(ctx).toBeDefined();
            expect(ctx.db).toBeDefined();
            expect(ctx.fileName).toBeDefined();
            done();
        }, function(e) {
            fail(e);
            done();
        });
    });

    //TODO: make sure it can write at specific positions
    it("should write to indexedDB", function(done) {
        file.flatMap(function(ctx) {
            return idb.fsWrite(ctx, testBuffer, 0, testBuffer.length, 0);
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
            return Rx.Observable.fromNodeCallback(idb.fsRead)(fileName);
        }).subscribe(function(args) {
            var res = args[0],
                evt = args[1];
            console.dir(res);
            console.log(res.blob);
            expect(res.blob).toEqual(testBuffer);
            done();
        }, function(e) {
            fail(e);
            done();
        });
    });

    it("should rename files", function(done) {
        var newName = "/something_else.txt";
        idb.fsRename(fileName, newName)
            .zip(idb.fsOpen(newName, "rw"))
            .flatMap(function(r, ctx) {
                return Rx.Observable.fromNodeCallback(idb.fsRead)(newName);
            }).subscribe(function(args) {
                var res = args[0],
                    evt = args[1];
                console.dir(res);
                console.log(res.blob);
                expect(res.blob).toEqual(testBuffer);
                done();
            }, function(e) {
                fail(e);
                done();
            });
    });

});
