const path = require("path");
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express
var mysql = require("mysql");
var crypto = require('crypto');
const request = require("request");
var date_utils = require("date-utils"); // npm install data-utils
const { resolveSoa } = require("dns");
/*
var connection = mysql.createConnection({//local DB에 연결.
    host: "localhost",
    user: "root",
    password: "8603",
    database: "bankapp",
    port: "3306"
});
*/
var connection = mysql.createConnection({
    host: "3.34.48.32",
    user: "root",
    password: "1234",
    database: "bankapp",
    port: "3306"
});

connection.connect();

request.defaults({ //rejectUnauthorized를 false값으로 두어야 https 서버통신 가능
    strictSSL: false, // allow us to use our self-signed cert for testing
    rejectUnauthorized: false
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //crt의 self-signed 문제 해결

var key = fs.readFileSync('./keys/sample/pr.pem', 'utf-8');
var certificate =  fs.readFileSync('./keys/sample/main_server.crt', 'utf-8');
var credentials = {key: key, cert: certificate};

//시간 출력
var newData = new Date();
var time = newData.toFormat('YYYY-MM-DD HH24:MI:SS');

var app = express();

app.use(express.urlencoded({ extended: false }));//form에서 데이터를 받아오자!

app.use(express.json());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public"))); //to use static asset

//1. 서버 상태 확인 프로세스
app.get("/", function(req,res){
    console.log("Server Time ["+ time +"] ACCESS - SUCCESS");
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
    var id=req.body.id;
    var passwd=req.body.passwd;

    console.log("Server Time ["+ time +"] LOGIN : "+"ID ["+req.body.id+"]  PASSWD ["+req.body.passwd+"]");

    //입력받은 아이디랑 비번은 암호화해서 확인해줘야함.
    //일방향 암호화 함수 적용해서 db에서 확인해주기!
    var hash_id = (crypto.createHash('sha512').update(String(id)).digest('base64'));
    var hash_passwd = (crypto.createHash('sha512').update(String(passwd)).digest('base64'));

    var sql = "SELECT * FROM bank WHERE ID = ? AND PW = ?";
    connection.query(
        sql, [hash_id, hash_passwd], function (error, results) {
        if (error) throw error;
        else {
            if (results.length == 0) {
                console.log("Server Time ["+ time +"] LOGIN - FAIL");
                var output={
                    "mode" : "login" , 
                    "result" : "false" , 
                    "session_key" : null
                }
                res.send(output);
            } else {
                var dbID=results[0].ID;
                var dbPW=results[0].PW;

                if(dbID==hash_id && dbPW==hash_passwd){
                    console.log("Server Time ["+ time +"] LOGIN - SUCCESS");

                    //2-2 성공 시 sessionKey 생성
                    var randomNum=Math.floor(Math.random() * 1000000000) + 1;//랜덤으로 숫자 만들기
                    var sessionKey=(crypto.createHash('sha512').update(String(randomNum)).digest('base64'));//일방향 암호화 함수 적용.

                    //2-3 . 로그인 결과  2-4. 세션키 저장
                    var sql2 = "UPDATE bank SET sessionKey = ? WHERE ID=?";
                    connection.query(sql2, [sessionKey, dbID], function(err, results){
                        if(err) throw err;
                        else{
                            //console.log("sessionKey created and insert");
                            var output={
                                "mode" : "login" , 
                                "result" : "true" , 
                                "session_key" : randomNum
                            }
                            //console.log(output);
                            res.send(output);
                        }
                    });
                }
                else{
                    console.log("Server Time ["+ time +"] LOGIN - FAIL");
                    var output={
                        "mode" : "login" , 
                        "result" : "false" , 
                        "session_key" : null
                    }
                    res.send(output);
                }
            }
        }
    });
});

//3.로그아웃(앱 종료) 프로세스
app.post("/logout",function(req,res){
    var session_key = req.body.session_key;

    var hash_session_key = (crypto.createHash('sha512').update(String(session_key)).digest('base64'));
    console.log("Server Time ["+ time +"] LOGOUT : "+"Session Key ["+req.body.session_key+"]");

    sql = "SELECT * FROM bank WHERE sessionKey = ?";
    connection.query(
        sql, [hash_session_key], function(error, results){
            if(error)   throw error;
            else{
                var dbSessionKey = results[0].sessionKey;
                var dbCI = results[0].CI;

                //3-2 DB 확인 및 세션 키 파기
                if(sessionKey = dbSessionKey){
                    console.log("Server Time ["+ time +"] LOGOUT - SUCCESS");

                    sql2 = "UPDATE bank SET sessionKey = ? WHERE CI = ?"
                    connection.query(
                        sql2,[" ",dbCI],function(error, results){
                            if(error)   throw error;
                            else{
                                //console.log("sessionKey destoryed");
                            }
                        });
                    
                    var output={
                        "mode":"logout",
                        "result":"true"
                    }
                    res.send(output);
                }
                else{
                    console.log("Server Time ["+ time +"] LOGOUT - FAIL");
                    var output={
                        "mode":"logout",
                        "result":"false"
                    }
                    res.send(output);
                }
            }
        });
});

// 5.hido에서 세션키를 보내면, db에서 CI를 찾아서 HIDO 서버에 전달
app.post("/registration/fingerprint", (req, res)=>{
    var sessionKey = req.body.session_key;
    console.log("Server Time ["+ time +"] REQUEST CI : "+"Session Key ["+req.body.session_key+"]");

    var sql="SELECT * FROM bank WHERE sessionKey = ?";
    connection.query(
        sql,[sessionKey], function(error, results){
            if(error)   throw error;
            else{
                if(results.length==0){
                    console.log("Server Time ["+ time +"] REQUEST CI - FAIL");
                }
                else{
                    var dbCI = results[0].CI;
                    var output={"CI": dbCI};
                    //console.log(output);
                    console.log("Server Time ["+ time +"] REQUEST CI - SUCCESS   / CI : " + dbCI);
                    res.json(output);
                }
            }
        });
});

//+) Bank , 입금자 정상 확인
app.post("/user/valid", function(req,res){
    console.log("Server Time ["+ time +"] USER VAILD : "+"Name ["+req.body.name+"]  Bank number ["+req.body.bank_number+"]  account number ["+req.body.account_number+"]");
    var name = req.body.name;
    var bank_number = req.body.bank_number;
    var account_number = req.body.account_number;

    var output;
    var bank_id = "T991641910U";
    var option = {
        method: "POST",
        url:"https://testapi.openbanking.or.kr/v2.0/inquiry/receive",
        headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " +
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJUOTkxNjQxOTEwIiwic2NvcGUiOlsib29iIl0sImlzcyI6Imh0dHBzOi8vd3d3Lm9wZW5iYW5raW5nLm9yLmtyIiwiZXhwIjoxNjA1ODYyNjQxLCJqdGkiOiJlZWE2NWIyNy1mZjc2LTRlZjUtYjI5Yy0yM2I3Yzc3OWYwOGEifQ.wsJoFuCA-9OLq7LcpSs0zcyt05EPDgOqcMkH_55mpgg",  
        },
        json: {
            bank_tran_id: bank_id+(Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000),
            // https://unikys.tistory.com/281
            cntr_account_type: "N",
            cntr_account_num: "8966432451",
            bank_code_std: "097",
            account_num: account_number, // 입금할 계좌 (클라이언트가 입력함)
            print_content: "용돈",
            tran_amt: "1000",
            req_client_name: name, // 받는 사람 이름 (클라이언트가 입력함)
            req_client_bank_code: "097",
            req_client_account_num: "7419279798",
            req_client_num: "1100760525",
            transfer_purpose: "TR"
        }
    }

    request(option, function(err, response, body) {
        var data = body.rsp_code;
        if(data == "A0000") {
            // 정상인 경우
            if(body.account_holder_name == req.body.name) {
                output = {'mode':"depositor_valid", 'result':"true"};
                console.log("Server Time ["+ time +"] USER VAILD - SUCCESS");
            }
            else
                output = {'mode':"depositor_valid", 'result':"false"}; 
        }
        else {
            output = {'mode':"depositor_valid", 'result':"false"}; 
            console.log("Server Time ["+ time +"] USER VAILD - FAIL");
        }
        res.json(output);
    });  
});

app.post("/user/balance", function(req,res){
    var session_key = req.body.session_key;
    // 검색, 조회
    // var balance = res.balance_amt;
    // res.send(balance);
    var output;
    var bank_id = "T991641910U";
    var option = {
        method: "GET",
        url:"https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
        headers: {
            Authorization:
            "Bearer " +
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxMTAwNzYwNTI1Iiwic2NvcGUiOlsiaW5xdWlyeSIsImxvZ2luIiwidHJhbnNmZXIiXSwiaXNzIjoiaHR0cHM6Ly93d3cub3BlbmJhbmtpbmcub3Iua3IiLCJleHAiOjE2MDYwNDI0OTYsImp0aSI6IjhiMzY4ODBiLTliM2EtNGE4Yy04NmQzLTM5MDQ1MTc4ZTFkNyJ9.9a-3BRoeuf4Yhe5OYE26tiHRlY6RBYvz-geTg49a51I",  
        },
        qs: {
            bank_tran_id: bank_id+(Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000),
            // https://unikys.tistory.com/281
            fintech_use_num: "199164191057885154033119",
            tran_dtime: "20200720113420"
        }
    }

    request(option, function(err, response, body) {
        var test = JSON.parse(body);
        if(test.rsp_code == "A0000") {
            // 정상인 경우
            output = {'mode':"balance", 'result':"true", 'value': test.balance_amt}; 
        }
        else {
            output = {'mode':"balance", 'result':"false", 'value':"null"}; 
        }
        res.json(output);         
    });

});

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(3000);

console.log('Bank A Server running');
