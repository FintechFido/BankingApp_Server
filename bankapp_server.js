const path = require("path");
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express
var mysql = require("mysql");
var crypto = require('crypto');
const request = require("request");
const { resolveSoa } = require("dns");

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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //crt의 self-signed 문제 해결

var key = fs.readFileSync('./keys/sample/pr.pem', 'utf-8');
var certificate =  fs.readFileSync('./keys/sample/main_server.crt', 'utf-8');
var credentials = {key: key, cert: certificate};

var app = express();

app.use(express.urlencoded({ extended: false }));//form에서 데이터를 받아오자!

app.use(express.json());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public"))); //to use static asset

//1. 서버 상태 확인 프로세스
app.get("/", function(req,res){
    console.log("server - get Test");
    var output = {
        "mode":"access",
        "result":"true"
    };
    console.log(output);
    res.send(output);
})

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/logout",(req,res)=>{
    res.render("logout");
});

//2. 로그인 프로세스
app.post("/login", (req,res)=>{
    var id=req.body.userId;
    var passwd=req.body.userPassword;

    console.log("LOGIN : "+"ID ["+req.body.id+"]  PASSWD ["+req.body.passwd+"]");

    //입력받은 아이디랑 비번은 암호화해서 확인해줘야함.
    //일방향 암호화 함수 적용해서 db에서 확인해주기!
    var hash_id = (crypto.createHash('sha512').update(String(id)).digest('base64'));
    var hash_passwdd = (crypto.createHash('sha512').update(String(passwd)).digest('base64'));

    var sql = "SELECT * FROM bank WHERE ID = ?";
    connection.query(
        sql, [hash_userId], function (error, results) {
        if (error) throw error;
        else {
            if (results.length == 0) {
                console.log("LOGIN - FAIL");
                var output={
                    "mode" : "login" , 
                    "result" : "false" , 
                    "session_key" : null
                }
                res.send(output);
            } else {
                var dbID=results[0].ID;
                var dbPW=results[0].PW;

                if(dbID==hash_userId && dbPW==hash_userPassword){
                    console.log("LOGIN - SUCCESS");

                    //2-2 성공 시 sessionKey 생성
                    var randomNum=Math.floor(Math.random() * 1000000000) + 1;//랜덤으로 숫자 만들기
                    var sessionKey=(crypto.createHash('sha512').update(String(randomNum)).digest('base64'));//일방향 암호화 함수 적용.

                    //2-3 . 로그인 결과  2-4. 세션키 저장
                    var sql2 = "UPDATE bank SET sessionKey = ? WHERE ID=?";
                    connection.query(sql2, [sessionKey, dbID], function(err, results){
                        if(err) throw err;
                        else{
                            console.log("sessionKey created");
                            var output={
                                "mode" : "login" , 
                                "result" : "true" , 
                                "session_key" : sessionKey
                            }
                            //console.log(output);
                            res.send(output);
                        }
                    });
                }
                else{
                    console.log("LOGIN - FAIL");
                    var output={
                        "mode" : "login" , 
                        "result" : "false" , 
                        "session_key" : null
                    }
                    //console.log(output);
                    res.send(output);
                }
            }
        }
    });
});

//3.로그아웃(앱 종료) 프로세스
app.post("/logout",function(req,res){
    var session_key = req.body.usersessionKey;

    console.log("LOGOUT : "+"Session Key ["+req.body.session_key+"]");

    sql = "SELECT * FROM bank WHERE sessionKey = ?";
    connection.query(
        sql, [session_key], function(error, results){
            if(error)   throw error;
            else{
                var dbSessionKey = results[0].sessionKey;
                var dbCI = results[0].CI;

                //3-2 DB 확인 및 세션 키 파기
                if(sessionKey = dbSessionKey){
                    console.log("LOGOUT - SUCCESS");

                    sql2 = "UPDATE bank SET sessionKey = ? WHERE CI = ?"
                    connection.query(
                        sql2,[" ",dbCI],function(error, results){
                            if(error)   throw error;
                            else{
                                console.log("sessionKey destoryed");
                            }
                        });
                    
                    var output={
                        "mode":"logout",
                        "result":"true"
                    }
                    res.send(output);
                }
                else{
                    console.log("LOGOUT - FAIL");
                    var output={
                        "mode":"logout",
                        "result":"false"
                    }
                    res.send(output);
                }
            }
        });
});

app.post("/registration/fingerprint", (req, res)=>{
    console.log('body',req.body);
    var sessionKey = req.body.session_key;
    var sql="SELECT * FROM bank WHERE sessionKey = ?";
    connection.query(
        sql,[sessionKey], function(error, results){
            if(error)   throw error;
            else{
                var dbCI = results[0].CI;
                var output={"CI": dbCI};
                console.log(output);
                res.json(output);
            }
        });
});

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(3000);

console.log('Server running');
