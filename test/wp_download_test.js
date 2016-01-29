var Download = require('../dist/app.js');

describe("download, save, and retrieve files to indexedDB", function() {
    var options = {
        strictSSL: false,
        url: "http://localhost:9876/base/test/files/img.jpg",
        path: "./img.jpg"
    };

    Download.setOb("indexedDB");
    var mtd = new Download(options);

    it("downloads files and saves them to indexedDB", function(done) {
        mtd.startSingle().then(function() {
            console.log("resolve");
            done();
        }, function(e) {
            console.error("reject");
            fail(e);
            done();
        });
    });

    it("retrieves the downloaded files from indexedDB", function(done) {
        mtd.fsRead(options.path, function(e, res, evt) {
            if(e || !res || !res.blob) {
                fail("file retrieval failed: " + e);
            } else {
                console.dir(res.blob)
                expect(res).toBeDefined();
                expect(res.blob).toBeDefined();
            }
            done();
        });
    });
});
