// npm instal speakeasy qrcode
const speakeasy = require('speakeasy'); 
const qrcode= require('qrcode');
// var secret = speakeasy.generateSecret({
//     name: "WeAreDevs"
// });
// console.log(secret);
// qrcode.toDataURL(secret.otpauth_url, function(err, data) {
//     console.log(data)
// })
// respons
// -------------
// {
//   ascii: 'HrTi4Kx7o1ZPya#zVaw2tdH@{IRk3){*',
//   hex: '48725469344b78376f315a507961237a56617732746448407b49526b33297b2a',
//   base32: 'JBZFI2JUJN4DO3ZRLJIHSYJDPJLGC5ZSORSEQQD3JFJGWMZJPMVA',
//   otpauth_url: 'otpauth://totp/WeAreDevs?secret=JBZFI2JUJN4DO3ZRLJIHSYJDPJLGC5ZSORSEQQD3JFJGWMZJPMVA'
// }
// ur->data:image/png;base64,iVBORw
// open google authenticator app and scan qr code
//
var verified = speakeasy.totp.verify({
secret: 'HrTi4Kx7o1ZPya#zVaw2tdH@{IRk3){*',
encoding: 'ascii',
token: '520050'
})
console.log(verified);