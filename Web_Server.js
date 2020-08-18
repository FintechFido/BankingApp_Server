const path = require("path");
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express
var mysql = require("mysql");
var crypto = require('crypto');
const request = require("request");


//mysql에 접근 가능한 사용자 확인 여부
var connection = mysql.createConnection({//TEST DB에 연결.
    host: "database.c0kvvrvcbjef.ap-northeast-2.rds.amazonaws.com",
    user: "admin",
    password: "12344321",
    database: "bankapp",
    port: "3306"
});
connection.connect();

var key = fs.readFileSync('./keys/pr.pem', 'utf-8');
var certificate = fs.readFileSync('./keys/main_server.crt', 'utf-8');
var credentials = { key: key, cert: certificate };

var app = express();

app.use(express.urlencoded({ extended: false }));//form에서 데이터를 받아오자!

app.use(express.json());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public"))); //to use static asset

app.get("/welcome", (req, res) => {
    res.render("welcome");
});

app.get("/login", (req, res) => {
    console.log("login page");
    res.render("login");
});

app.post("/login", (req, res) => {
    var userId = req.body.userId;
    var userPassword = req.body.userPassword;

    var sql = "SELECT * FROM bank WHERE ID = ?";
    connection.query(
        sql, [userId], function (error, results) {
            if (error) throw error;
            else {
                if (results.length == 0) {
                    res.json("등록되지 않았소.");
                } else {
                    var dbId = results[0].id;//입력받은 아이디는 암호화로 바꿔서 확인해줘야함.
                    var dbPassword = results[0].password;//입력받은 비밀번호는 해시로 바꿔서 확인해주기!

                    if (dbId == userId && dbPassword == userPassword) {
                        console.log("로그인 확인!");

                        //세션키 생성하고 암호화진행
                        var randomNum = Math.floor(Math.random() * 1000000000) + 1;//랜덤으로 숫자 만들기
                        var sessionKey = (crypto.createHash('sha512').update(String(randomNum)).digest('base64'));

                        console.log("세션키 암호화해서 만들었다! ==> ", sessionKey);

                        var sql2 = "UPDATE bank SET sessionKey = ? WHERE ID=?";
                        connection.query(sql2, [sessionKey, userId], function (err, results) {
                            if (err) throw err;
                            else {
                                console.log("sessionKey 등록");
                                res.json(sessionKey);
                            }
                        });
                    }
                }
            }
        });
});
/*
app.get("/registration/fingerprint", function (req, res) {
    console.log("get");
    res.writeHead(200);
    res.end("CI GET Success");
})
*/
app.get("/registration/fingerprint", (req, res) => {
    // 은행 서버가 HIDO 서버에 CI 전달
    // Session key, ci, 은행코드
    var ci = req.body.ci;

    var sql = "SELECT * FROM bank WHERE ID = ?";
    connection.query(sql, [ci], function (error, results) {
        if (error) throw error;
        else {
            var dbci = results[0].ci;
            if (dbci == ci) { //ci이외에 session key, 은행코드 추가해줘야함
                console.log('ci connect!');
            }
        }
    })
})
                


app.get("/get_test", function (req, res) {
    console.log("get");
    res.writeHead(200);
    res.end("GET Success");
})

app.post("/post_test", function (req, res) {
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
httpsServer.listen(3000);


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