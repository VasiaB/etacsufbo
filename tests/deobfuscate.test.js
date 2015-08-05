'use strict';

var fs = require('fs');
var path = require('path');

var esprima = require('esprima');
var expect = require('chai').expect;

var deobfuscator = require('../lib/deobfuscator');
var util = require('../lib/util');

var sample = function(fileName) {
  var fullName = path.join(__dirname, 'cases', fileName + '.js');
  return fs.readFileSync(fullName).toString('utf8');
};

var expression = util.expression;

describe('statical evaluate', function() {
  it('should evaluate literals', function(done) {
    var code = sample('jsobfuscator.com');
    expect(deobfuscator.clean(code)).to.be.not.empty;
    done();
  });
});