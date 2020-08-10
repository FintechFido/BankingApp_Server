var crypto = require('crypto');
var fs = require('fs');
const { Console } = require('console');

// 물리적으로 생성한 한쌍의 키
// 개인키로 공개키를 유추할 수 있으나 공개키로 개인키를 유추할 수 없음
// OpenSSL 에서 Key를 만드는 방식은 개인키 생성 후 개인키를 기반으로 공개키를 추출하는 방식

var pr = "-----BEGIN RSA PRIVATE KEY-----\n"+
"MIIEpAIBAAKCAQEA1GCafyH4kCrMWLZh5Y0CCzK378kvKg8NZqD39rwxBSbyKCaH\n"+
"CBt0TWHjcYmyzc+KtN7wrc9aAxkR+k/bXXbCMqnMOFdUPwX6uRSznkwbex9qjOB7\n"+
"s2fuyFLzpdRKJiuquB9IheG432Ci/zxz9dYx6fSevqzqZidISGILJqc/6A5pVMxZ\n"+
"dBjgHSZPsJ0CSI8h526atGZYQ2Bg1kRnpFtPMmowri+zzGNvRFGYCn6oh7eCy8x4\n"+
"AJaw2CVxTTN6QjiORyl/fBhMqPT9k1kdQy4DaXcURC7lT4tCZbi82uHK2erUI5ag\n"+
"tws+aS6+QeQkYdf3/k5G0vjWGCjx7FM0Q8toBwIDAQABAoIBAGWmd0wybk5Srcwo\n"+
"P2MnwrqpY/CZUsHGwptEoGqwWKYmpfEhv6/ZtCj1mW9WgQaRN8qqingmruacsUYl\n"+
"wtFRblHhg6XT5rbjncXIatBxjRW5S75yE8MjE98+FPBiU7tBW00VbBjomRwRnPKd\n"+
"dMNN6kYYl4KcMPUECEzc4Il3s9bVb88A18fbrmDgHOqXDAi3DNhUKJ1rfKFi/Jgi\n"+
"6WCSm9gvbHdnkGdRvoYBbxzF34cT0o73gtQQmBrlpyytVGFwPydSa+ER+i0rhZQ+\n"+
"4JK2V+QZIc2N5NcmRnNQiHmNpq1tzssgTr1g9YAuo8nLi+Ay60SqorkqTidGNiuL\n"+
"kx8nOYECgYEA6irCpfD1C35o9RO6Gte2tBgUuLgd9r/HKHew5CQo3NJit12a814K\n"+
"8Y2TFSOAE1UgD5kwXyifWg3dv1oicR1tqbLN0A/0iAIcPpLTVWP7UIyqgMT3SEc8\n"+
"weMSz3JhbquI/rD3oMY32sHSuv4++S7qQrnrF8Aodv5mF2MPhkBUzC8CgYEA6C3B\n"+
"C0FuNasXeLBw2sbOdaZXVCnzrwnFgL/9/QqUBLs2P5vC+mrNcS4osg5SxWf4ll2v\n"+
"FOWmJnKMn7b2pm+kTU6ucje60k3gO2FgMzHdBIUKrv6Zdnhy0pD0cI7GvYCs8o8o\n"+
"8PFqchLKxs16CArqewhF37c8sTjNpbPiWBIA86kCgYEAzlukcUwpBln98IvT47fZ\n"+
"oFfgWvCWJ07WGYlw73wWLpOQvvrUhEeJ6VjUFzrTsTXBLT3YbOOFmnzBv9GUrI48\n"+
"h+G0kfidjAYgEdyeNJAJdvCfiR8KtD1jA5Iyj3HC/x5XeetGLf7AVh2csYFAyaNY\n"+
"ejkRPjru7f4+xblcgvjKQa0CgYEA4OJgVvybORRs+ZM83Esv8riZYYX46BO430oX\n"+
"Qx8Z27NRii7enhsQvo2NEVnaRia8mzhGuyDs29Sb7J8VLIR6Sf7p7OuZ4tVXWWyp\n"+
"9yxW/We3v2QPVLa50MZiXRuN2ENoQND1QNs01STqj8C6cEvSbjTHKTeca7OvTM59\n"+
"b/yQO3ECgYBHkVyTyao1WEjfm0bjQ+Vef/bUe3/1/NFaFUJ3t7ixoCTixqbEQZeJ\n"+
"RjEMyu05hU1WTM/kU4S48hKicoS3O/sVj6hsEMmBp6ZjFPoQKRYl/xjQQiZFrAlA\n"+
"J8IikBlF5fBriORRE2JZ/f8iwZErK4xEfM5DWa9hA7Q+Bzl21DXcqQ==\n"+
"-----END RSA PRIVATE KEY-----\n";

var pu = "-----BEGIN PUBLIC KEY-----\n"+
"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1GCafyH4kCrMWLZh5Y0C\n"+
"CzK378kvKg8NZqD39rwxBSbyKCaHCBt0TWHjcYmyzc+KtN7wrc9aAxkR+k/bXXbC\n"+
"MqnMOFdUPwX6uRSznkwbex9qjOB7s2fuyFLzpdRKJiuquB9IheG432Ci/zxz9dYx\n"+
"6fSevqzqZidISGILJqc/6A5pVMxZdBjgHSZPsJ0CSI8h526atGZYQ2Bg1kRnpFtP\n"+
"Mmowri+zzGNvRFGYCn6oh7eCy8x4AJaw2CVxTTN6QjiORyl/fBhMqPT9k1kdQy4D\n"+
"aXcURC7lT4tCZbi82uHK2erUI5agtws+aS6+QeQkYdf3/k5G0vjWGCjx7FM0Q8to\n"+
"BwIDAQAB\n"+
"-----END PUBLIC KEY-----\n";

var msg = " Original Message is This ";

var encmsg = crypto.privateEncrypt(pr,Buffer.from(msg,'utf-8')).toString('base64'); // 개인키로 암호화
var decmsg = crypto.publicDecrypt(pu,Buffer.from(encmsg, 'base64')); // 공개키로 복호화

console.log("\nCase 1 Cipher : " + encmsg + "\n");
console.log("Case 1 Plain : " + decmsg.toString() + "\n");


encmsg = crypto.publicEncrypt(pu,Buffer.from(msg,'utf-8')).toString('base64'); // 개인키로 암호화
decmsg = crypto.privateDecrypt(pr,Buffer.from(encmsg, 'base64')); // 공개키로 복호화

console.log("\nCase 2 Cipher : " + encmsg + "\n");
console.log("Case 2 Plain : " + decmsg.toString() + "\n");

