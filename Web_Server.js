var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express

var key = fs.readFileSync('pr.pem', 'utf-8');
var certificate =  fs.readFileSync('main_server.crt', 'utf-8');
var credentials = {key: key, cert: certificate};

var app = express();

app.use(express.json());

app.get("/get_test", function(req,res){
    console.log("get");
    res.writeHead(200);
    res.end("GET Success");
})

app.post("/post_test", function(req,res){


    //console.log("post : "+req.body);
    console.log(req.body);
    res.send("Post Success");
})

var httpsServer = https.createServer(credentials, app);
/*
httpsServer.on('request',function(req,res){
    console.log(req.body+" "+res.body);
    res.writeHead(200);
    res.end('hello world\n');
})
*/

// httpsServer.listen(443);
httpsServer.listen(8080);

/*
var hostname = '172.31.4.25'; //자신의 private IP 주소
var port = 8080;

var options = 
{
    key: fs.readFileSync('pr.pem', 'utf-8'),
    cert: fs.readFileSync('main_server.crt', 'utf-8')
    //key: fs.readFileSync('pr.pem', 'utf-8'),
    //cert: fs.readFileSync('main_server.crt', 'utf-8')
};

https.createServer(options, function(req, res)
{
    res.writeHead(200);
    res.end('hello world\n');

}).listen(port, hostname);


/*
http.createServer(function(req, res){
    res.writeHead(200);
    res.end('hello world\n');

}).listen(port, hostname);
*/


console.log('Server running');