'use strict';

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var Syntax = esprima.Syntax;

var util = require('./util');
var Constants = require('./constants');

// base64 encode/decode utils
global.btoa = str => new Buffer(str.toString()).toString('base64');
global.atob = str => new Buffer(str, 'base64').toString();

// mock window object in node context
global.window = global.window || global;

/**
 * convert literal to AST
 * @param  {Any} value raw value
 * @return {Node}       root node of the AST
 */
var wrap = value => util.expression(JSON.stringify(value));

// ES7 includes polyfill
Array.prototype.includes = e => this.indexOf(e) > -1;

/**
 * deobfuscate code
 * @param  {String} code obfuscated code
 * @return {String}      deobfuscated
 */
function deobfuscate(code) {
  var ast = esprima.parse(code);
  // todo: scope chain
  var symbols = {};

  // rewrite
  ast = estraverse.replace(ast, {
    leave: function(node) {
      switch (node.type) {
        case Syntax.VariableDeclarator:
          if (util.isStatic(node.init)) {
            symbols[node.id.name] = util.parseStatic(node.init);
          }

          break;

        case Syntax.BinaryExpression:
          if ([node.left, node.right].every(e => e.type === Syntax.Literal)) {
            let left = node.left.value;
            let right = node.right.value;
            let results = {
              '|': left | right,
              '^': left ^ right,
              '&': left & right,
              '==': left == right,
              '!=': left != right,
              '===': left === right,
              '!==': left !== right,
              '<': left < right,
              '>': left > right,
              '<=': left <= right,
              '>=': left >= right,
              '<<': left << right,
              '>>': left >> right,
              '>>>': left >>> right,
              '+': left + right,
              '-': left - right,
              '*': left * right,
              '/': left / right,
              '%': left % right
            };

            if (results.hasOwnProperty(node.operator)) {
              let val = results[node.operator];
              return wrap(val);
            }
          }

          break;

        case Syntax.LogicalExpression:
          if (node.left.type === Syntax.Literal && node.right.type === Syntax.Literal) {
            let left = node.left.value, right = node.right.value;
            let results = {
              '||': left || right,
              '&&': left && right
            };

            if (results.hasOwnProperty(node.operator)) {
              let val = results[node.operator];
              return wrap(val);
            }
          }
          break;

        case Syntax.UnaryExpression:
          if (node.argument.type === Syntax.Literal) {
            let arg = node.argument.value;
            let results = {
              '+': +arg,
              '-': -arg,
              '~': ~arg,
              '!': !arg,
              'delete': false,
              'void': undefined,
              'typeof': typeof arg
            };

            if (results.hasOwnProperty(node.operator)) {
              let val = results[node.operator];
              return wrap(val);
            }
          }
          break;

        case Syntax.CallExpression:
          if (node.callee.type === Syntax.Identifier &&
            Constants.Functions.includes(node.callee.name) &&
            util.isStaticArguments(node)) {

            let method = global[node.callee.name];
            let val = method.apply(null, util.parseArguments(node));
            return wrap(val);
          }

          if (node.callee.type === Syntax.MemberExpression) {
            let callee = node.callee;

            if (callee.object.type === Syntax.Identifier &&
              Constants.Objects.hasOwnProperty(callee.object.name) &&
              callee.property.type === Syntax.Identifier &&
              Constants.Objects[callee.object.name].includes(callee.property.name) &&
              util.isStaticArguments(node)) {

              let method = global[callee.object.name][callee.property.name];
              let val = method.apply(null, util.parseArguments(node));
              return wrap(val);
            }

            if (callee.property.type === Syntax.Identifier) {
              let calleeVal;
              if (callee.object.type === Syntax.Literal) {
                // number.toString(), 'string'.substr
                calleeVal = callee.object.value;
              } else if (util.isStatic(callee.object)) {
                // ['a', 'r', 'r', 'a', 'y'].join
                calleeVal = callee.object.elements.map(e => e.value);
              }

              if (typeof calleeVal !== 'undefined') {
                let calleeType = typeof calleeVal;
                // holy Javascript
                if (calleeType === 'object' && Array.isArray(calleeVal)) {
                  calleeType = 'array';
                }
                if (Constants.Methods.hasOwnProperty(calleeType) &&
                  Constants.Methods[calleeType].includes(callee.property.name) &&
                  util.isStaticArguments(node)) {
                  let method = calleeVal[callee.property.name];

                  let val = method.apply(calleeVal, util.parseArguments(node));
                  return wrap(val);
                }
              }
            }

          }
          break;

        case Syntax.MemberExpression:
          // 'test'.length, /regexp/.source
          if (!node.computed &&
            node.property.type === Syntax.Identifier) {
          
            if (node.object.type === Syntax.Literal) {
              let objType = typeof node.object.value;

              // RegExp
              if (objType === 'object') {
                objType = 'regex';
              }

              if (Constants.Properties.hasOwnProperty(objType) &&
                Constants.Properties[objType].includes(node.property.name)) {
                let val = node.object.value[node.property.name];
                return wrap(val);
              }
            }

          }

          if (node.computed &&
            symbols.hasOwnProperty(node.object.name) &&
            node.property.type === Syntax.Literal) {
            let val = symbols[node.object.name][node.property.value];
            if (typeof val === 'string')
              return wrap(val);
          }

          // convert brackets to dot
          if (
            node.property.type === Syntax.Literal &&
            typeof node.property.value === 'string'
          ) {
            return {
              type: Syntax.MemberExpression,
              computed: false,
              object: node.object,
              property: {
                type: Syntax.Identifier,
                name: node.property.value
              }
            };
          }
          break;

        default:
      }
    }

  });

  return escodegen.generate(ast);
}

exports.clean = deobfuscate;
