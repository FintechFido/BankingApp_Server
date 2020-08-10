var express = require("express"); // npm install express
var session = require('express-session');
var MySQLStore = require('express-mysql-session');
const bodyParser = require('body-parser');

var app = express();

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

