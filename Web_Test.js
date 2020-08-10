var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express
var session = require('express-session');
var MySQLStore = require('express-mysql-session');
const bodyParser = require('body-parser');

var key = fs.readFileSync('pr.pem', 'utf-8');
var certificate =  fs.readFileSync('main_server.crt', 'utf-8');
var credentials = {key: key, cert: certificate};

var app = express();

app.use(express.json());

app.use(session({
    secret:'ABCD1234ABAB!@',
    resave:false,
    saveUninitialized:true,
    stroe:new MySQLStore({
        host:'localhost',
        port:3306,
        user:'root',
        password:'8603',
        database:'bankapp'
    })

}));

app.use(bodyParser.urlencoded({extended:false}));

app.get("/login", (req,res)=>{
    console.log("login page");
    var output=`
    <h1>Login<h1>
    <form action="/login" method="POST">
        <p>
        <input type="text" name="id" placeholder="ID">
        </p>

        <p>
        <input type="text" name="pw" placeholder="PW">
        </p>

        <p>
        <input type="submit">
        </p>
    </form>
    `;

    res.send(output);
});

app.post('/login', (req,res)=>{
    var userinfo={
        user_id:"test",
        user_pw:"1234",
        displayName:"me"
    };

    var uid=req.body.id;
    var upwd=req.body.pw;

    if(uid===userinfo.user_id&&upwd===userinfo.user_pw){
        req.session.displayName=userinfo.displayName;
        req.session.save(()=>{
            res.redirect('/welcome');
        });
    }else{
        res.send("This is no id!");
    }
});

app.get("/welcome", (req, res)=>{
    var output="";
    if(req.session.displayName){
        output+=`
        <h1>Hello, ${req.session.displayName}</h1>
        `;
        res.send(output);
    }else{
        output+=`
        <h1>Welcome</h1>
        `;
        res.send(output);
    }
});

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
httpsServer.listen(443);


/*
var hostname = '192.168.0.6'; //자신의 private IP 주소
var port = 443;

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