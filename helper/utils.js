exports.randomString = function (length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHUJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
};

exports.response = function (res, code, obj) {
  var resultPrint = {status: '1', data: obj};
  if (code !== 200) {
    resultPrint.status = "0";
    resultPrint.msg = obj.message;
  }

  if (obj && obj.name === 'ValidationError') {
    var err = [];
    for (i in obj.errors) {
      err.push(obj.errors[i].message);
    }
    resultPrint.msg = err.join(",");
  }

  resultPrint.id = require('node-uuid').v4();
  resultPrint.code = code;
  res.send(resultPrint);
};
