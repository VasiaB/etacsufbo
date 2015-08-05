var xor = function(str, a, b) {
  return String.fromCharCode.apply(null, str.split('').map(function(c, i) {
    var ascii = c.charCodeAt(0);
    return ascii ^ (i % 2 ? a : b);
  }));
};

var xorEncoded = xor('~p\u001b-uqYG\u001eG~+Ylu{k-o', 24, 42);
var fromASCII = String.fromCharCode(32, 97, 46, 34, 0x27);
var fromBase64 = atob(['a', 'G', 'V', 's', 'b', 'G', '8', 'g', 
  'd', '2', '9', 'y', 'b', 'G', 'Q', '='].join(''));
var big = 'hello, world'.split('').reverse().join('').big();