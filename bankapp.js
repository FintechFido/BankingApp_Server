const path = require("path");
var https = require('https');// var http = require('http');
// var routes = require('./routes');
// var user = require('./routes/user');
var fs = require('fs');
var express = require("express"); // npm install express
var mysql = require("mysql");
var crypto = require('crypto');
const request = require("request");


//mysql에 접근 가능한 사용자 확인 여부
var connection = mysql.createConnection({//local db
    host: "127.0.0.1", //localhost
    user: "root",
    password: "1234",
    database: "bankapp",
    port: "3306"
});
connection.connect();
/*
var connection = mysql.createConnection({//TEST DB에 연결.
    host: "database.c0kvvrvcbjef.ap-northeast-2.rds.amazonaws.com",
    user: "admin",
    password: "12344321",
    database: "bankapp",
    port: "3306"
});
connection.connect();
*/

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

app.post("/login", (req,res)=>{
    var userId=req.body.userId;
    var userPassword=req.body.userPassword;

    //입력받은 아이디랑 비번은 암호화해서 확인해줘야함.
    //일방향 암호화 함수 적용해서 db에서 확인해주기!
    var hash_userId = (crypto.createHash('sha512').update(String(userId)).digest('base64'));
    var hash_userPassword = (crypto.createHash('sha512').update(String(userPassword)).digest('base64'));

    var sql = "SELECT * FROM bank WHERE ID = ?";
    connection.query(
        sql, [hash_userId], function (error, results) {
        if (error) throw error;
        else {
            if (results.length == 0) {
                res.json("등록되지 않았소.");
            } else {
                var dbID=results[0].id;
                var dbPW=results[0].pw;

                if(dbID==hash_userId && dbPW==hash_userPassword){
                    console.log("로그인 성공!");

                    //세션키 생성하고 암호화진행
                    var randomNum=Math.floor(Math.random() * 1000000000) + 1;//랜덤으로 숫자 만들기
                    var sessionKey=(crypto.createHash('sha512').update(String(randomNum)).digest('base64'));//일방향 암호화 함수 적용.

                    console.log("세션키 암호화해서 만들었다! ==> ", sessionKey);

                    var sql2 = "UPDATE bank SET sessionKey = ? WHERE ID=?";
                    connection.query(sql2, [sessionKey, dbID], function(err, results){
                        if(err) throw err;
                        else{
                            console.log("sessionKey 등록");
                            var jsonData={"sessionkey":sessionKey};
                            res.send(jsonData);
                        }
                    });
                }
                else{
                    console.log("로그인 실패");
                    var jsonData={"sessionkey":null};
                    res.send(jsonData);
                }
            }
        }
    });
});


// 4.hido에서 세션키를 보내면, db에서 CI를 찾아서 SessionKey, 은행코드와 함께 HIDO 서버에 전달
app.get("/registration/fingerprint", function(req, res){ 
    //유저가 HIDO 서버에 생체정보 등록 요청
    
    var sessionKey='tjLu+BFQTGEi5iyMGE+Eu6qthLDmE/XbyilK9Qx2RH41PgCQi4r/ZXGPV995ctUGpakcB7e7WH8OZZ5EJreDtA==';
    //세션키는 client-hido-bankapp을 거쳐서 넘어옴(우선 임의로 지정)

    if(sessionKey!=null){
        var sql="SELECT * FROM bank WHERE sessionKey = ?";
        connection.query(
            sql,[sessionKey], function(error, results){
                if(error)   throw error;
                else{
                    var dbCI = results[0].ci;
                    var dbBankCode=results[0].bankcode;
                    var jsonData={"sessionKey":sessionKey, "CI":dbCI, "bankcode":"001"};
                    res.send(jsonData);
                    }});
    }else{
        console.log("sessionkey 없음");
    }
});
                
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

httpsServer.listen(3000);
console.log('Server running');

/*
httpsServer.on('request',function(req,res){
    console.log(req.body+" "+res.body);
    res.writeHead(200);
    res.end('hello world\n');
})

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


