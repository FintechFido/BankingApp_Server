const path = require("path");
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express
var mysql = require("mysql");
var crypto = require('crypto');
const request = require("request");

//mysql에 접근 가능한 사용자 확인 여부
// var connection = mysql.createConnection({//TEST DB에 연결.(aws)
//     host: "database.c0kvvrvcbjef.ap-northeast-2.rds.amazonaws.com",
//     user: "admin",
//     password: "12344321",
//     database: "bankapp",
//     port: "3306"
// });

var connection = mysql.createConnection({//local DB에 연결.
    host: "localhost",
    user: "root",
    password: "8603",
    database: "bankapp",
    port: "3306"
});

connection.connect();

var key = fs.readFileSync('./keys/sample/pr.pem', 'utf-8');
var certificate =  fs.readFileSync('./keys/sample/main_server.crt', 'utf-8');
var credentials = {key: key, cert: certificate};

var app = express();

app.use(express.urlencoded({ extended: false }));//form에서 데이터를 받아오자!

app.use(express.json());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public"))); //to use static asset

app.get("/login", (req,res)=>{
    console.log("login page");
    res.render("login");
});

app.get("/welcome", (req, res)=>{
   res.render("welcome");
});

app.post("/login", (req,res)=>{
    var userId=req.body.userId;
    var userPassword=req.body.userPassword;

    console.log(userId, userPassword);

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
                var dbID=results[0].ID;
                var dbPW=results[0].PW;

                if(dbID==hash_userId && dbPW==hash_userPassword){
                    console.log("로그인 확인!");

                    //세션키 생성하고 암호화진행
                    var randomNum=Math.floor(Math.random() * 1000000000) + 1;//랜덤으로 숫자 만들기
                    var sessionKey=(crypto.createHash('sha512').update(String(randomNum)).digest('base64'));//일방향 암호화 함수 적용.

                    console.log("세션키 암호화해서 만들었다! ==> ", sessionKey);

                    var sql2 = "UPDATE bank SET sessionKey = ? WHERE ID=?";
                    connection.query(sql2, [sessionKey, dbID], function(err, results){
                        if(err) throw err;
                        else{
                            console.log("sessionKey 등록");
                            //res.json(sessionKey);

                            var jsonDataObj = {IF: 'login', date: ['im here', 'and here']};
                            request.post({
                                headers:{'content-type':'application/json'},
                                url:"https://localhost:3002/getData",
                                body:jsonDataObj,
                                json:true
                            }, function(error, response, body){
                                console.log(body);
                                res.json(body);
                            });
                        }
                    });
                }
            }
        }
    });
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
httpsServer.listen(3000);

console.log('Server running');
