var http = require("http");
var fs = require("fs");
var url = require("url");
var express = require("express");
var app = express();
var request = require('request');
var cheerio = require('cheerio');
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/NEWSTORYDB";
var max;
http.createServer(app).listen(8081);
console.log('Server dang chay tai dia chi: http://127.0.0.1:8081/');

app.get("/", function(req, res) {
    res.sendFile("/B2.htm");
});

app.get("/a", function(req, res) {
    MongoClient.connect(url, function(err, db) {
        db.collection("counters").find().toArray(function(err, result) {
            max = JSON.stringify(result[0].sequence_value);
        })
        var newstory = Math.floor(Math.random() * max) + 1;
        var query = {
            _id: newstory
        };
        db.collection("STORY").find(query).toArray(function(err, result) {
            if (err) throw err;
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(result[0]));
        });
    });
});

app.get("/u", function(req, res) {
    for (var x = 1; x < 10; x++) {
        var url1 = 'http://www.truyencuoihay.vn/?pagenumber=' + x;
        var Title = [];
        var description = [];
        request(url1, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                var $ = cheerio.load(body);
                $('.product-title a').each(function() {
                    Title.push($(this).text());
                });
                $('.description').each(function() {
                    var main = '';
                    $(this).children('p').each(function() {
                        main += $(this).text() + '<br>';
                    })
                    description.push(main);
                    main = '';
                });
                if (description[0] == "") description.shift();
                var CheckTitle = [];
                MongoClient.connect(url, function(err, db) {
                    db.collection("STORY").find().toArray(function(err, result) {
                        for (var i = 0; i < result.length; i++) {
                            CheckTitle.push(JSON.stringify(result[i].title));
                        }
                        for (var j = 0; j < Title.length; j++) {
                            if (CheckTitle.indexOf('"' + Title[j] + '"') == -1) {
                                function Update(j) {
                                    db.collection("counters").find().toArray(function(err, result) {
                                        max = JSON.stringify(result[0].sequence_value);
                                        db.collection("STORY").insert({
                                            _id: (Math.floor(max) + 1),
                                            story: description[j],
                                            title: Title[j]
                                        }, function(err, reusult) {
                                            if (err) {
                                                Update(j)
                                            }
                                        });
                                        db.collection('counters').update({
                                            "_id": "productid"
                                        }, {
                                            "sequence_value": Math.floor(max) + 1
                                        }, {
                                            "multi": false
                                        }, function(err, result) {});

                                    })
                                }
                                Update(j);
                            }
                        }
                    });
                });
            }
        })

    }
});