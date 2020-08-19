var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require("express"); // npm install express
const request = require("request");
var mysql = require("mysql");

var app = express();
app.use(express.json());

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //crt의 self-signed 문제 해결

var key = fs.readFileSync('./keys/hidopr.pem', 'utf-8');
var certificate =  fs.readFileSync('./keys/hido_server.crt', 'utf-8');
var credentials = {key: key, cert: certificate};

var connection = mysql.createConnection({//local db
    host: "127.0.0.1", //localhost
    user: "root",
    password: "1234",
    database: "hido",
    port: "3306"
});
connection.connect();

app.get("/get_test", function(req,res){
    console.log("get");
    res.writeHead(200);
    res.end("GET Success");
})

app.post("/post_test", function(req,res){
    console.log(req.body);
    res.send("Post Success");
})

request.defaults({ //rejectUnauthorized를 false값으로 두어야 https 서버통신 가능
    strictSSL: false, // allow us to use our self-signed cert for testing
    rejectUnauthorized: false
});

/* request 예시
request('https://127.0.0.1:3000/get_test', //localhost
    function (error, response, body) {
        console.error('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    }); //bankapp 서버에서 보낸 값을 받아옴
// fs.createReadStream('file.json').pipe(request.put('http://mysite.com/obj.json'))
*/

//2.IMEI와 구동 은행 앱 코드에 해당되는 데이터 있으면 FALSE, 없으면 진행
app.post("/registration/fingerprint", function(req, res){ 
    //유저가 HIDO 서버에 생체정보 등록 요청

    var sessionKey=req.body.sessionKey;//세션키
    var curBankCode=req.body.curBankCode;//현재 구동중인 은행 앱 코드
    var IMEI = req.body.IMEI;//IMEI
    console.log(sessionKey);

    if(sessionKey!=null){
        var sql="SELECT * FROM key WHERE IMEI=? AND bankcode = ?";
        connection.query(
            sql,[IMEI, curBankCode], function(error, results){
                if(error)   throw error;
                else{
                    var dbIMEI = results[0].IMEI;
                    var dbBankCode=results[0].bankcode;

                    if(dbIMEI==IMEI && dbBankCode==curBankCode){
                        console.log("False");
                        var jsonData={"sessionKey":null, "bankcode":null};
                        res.send(jsonData);
                    }else{
                        console.log("진행");
                        var jsonData={"sessionKey":sessionKey, "bankcode":curBankCode};
                        res.send(jsonData);
                    }
                }
            });
    }else{
        console.log("key를 받아오지 못했음. False");
        var jsonData={"sessionKey":null, "bankcode":null};
        res.send(jsonData);
    }
});

//3.bankapp 서버에 SessionKey 전달해서 CI 값 받아오기
request('https://127.0.0.1:3000/registration/fingerprint', function (error, response, body) {
        console.error('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    }); 


/* read json file_비동기 방식
fs.readFile('./todos.json', 'utf8', (error, jsonFile) => {
    if (error) return console.log(error);
    console.log(jsonFile);

    const jsonData = JSON.parse(jsonFile);
    console.log(jsonFile);

    const todos = jsonData.todos;
    todos.forEach(todo => {
        console.log(todo);
    });
});
*/
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(3002);
console.log('Server running');