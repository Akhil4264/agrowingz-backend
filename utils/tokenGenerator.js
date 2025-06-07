const crypto = require('crypto');

exports.tokenGenerator = (length) => {
  return crypto.randomBytes(Math.ceil(length * 0.75))
               .toString('base64')  // base64 is 6 bits per char
               .replace(/\+/g, 'A') // replace non-url-safe chars
               .replace(/\//g, 'B')
               .replace(/=/g, '')   // remove padding
               .substring(0, length);
}


exports.generateOtp = (length) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}
