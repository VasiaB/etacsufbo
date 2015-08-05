var esprima = require('esprima');
var expect = require('chai').expect;
var util = require('../lib/util');
var expression = util.expression;

const CODE_DEEP_ARRAY = '[0,1,2,[3,4,5,[6],7,8,[9,10,[11,12,[13],14,15]]]]';
const CODE_DEEP_DICT = '({a:{b:{c:true},d:1},e:2})';
const CODE_REGEX = '/\w{0,3}/i';

var staticCall = expression('String.fromCharCode(32, 97, 46, 34, 39)');
var deepArray = expression(CODE_DEEP_ARRAY);
var deepDict = expression(CODE_DEEP_DICT);
var regexp = expression(CODE_REGEX);

describe('util functions', function() {
  it('should judge static literals', function(done) {
    expect(util.isStaticArguments(staticCall)).to.be.true;
    expect(util.isStatic(deepArray)).to.be.true;
    expect(util.isStatic(deepDict)).to.be.true;
    expect(util.isStatic(regexp)).to.be.true;

    expect(util.isStatic(expression('Math.cos(65536)'))).to.be.false;
    expect(util.isStaticArguments(expression('Math.cos(Date.now())'))).to.be.false;
    
    done();
  });

  it('should extract value from expression', function(done) {
    expect(util.parseArguments(staticCall)).to.deep.equal([32, 97, 46, 34, 39]);
    expect(util.parseStatic(deepArray)).to.deep.equal(eval(CODE_DEEP_ARRAY));
    expect(util.parseStatic(deepDict)).to.deep.equal(eval(CODE_DEEP_DICT));
    expect(util.parseStatic(regexp)).to.deep.equal(eval(CODE_REGEX));
    
    done();
  });

  it('should handle unexpected input', function(done) {
    expect(util.parseStatic('wtf')).to.be.null;
    expect(util.parseStatic('Math.cos(123)')).to.be.null;
    expect(util.parseStatic('[![], +[], 123]')).to.be.null;

    done();
  });

});