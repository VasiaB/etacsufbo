#!/usr/bin/env node --harmony --harmony_arrow_functions

'use strict';

var fs = require('fs');

var deobfuscator = require('./lib/deobfuscator');

// run as a command line tool
//
// Usage:
//   node deobfuscator.js input [output]
// 
if (typeof process !== 'undefined') {
  let argv = process.argv;

  if ([3, 4].indexOf(argv.length) > -1) {
    let src = argv[2];
    let dst = argv[3];

    fs.readFile(src, function(err, content) {
      if (err) {
        throw err;
      }

      var code = deobfuscator.clean(content.toString('utf8'));
      if (dst) {
        fs.writeFile(dst, code);
      } else {
        console.log(code);
      }
    });
  } else if (argv.length === 2) {
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', function() {
      var chunk = process.stdin.read();
      if (chunk && chunk.length) {
        try {
          console.log('----'.repeat(20));
          console.log(deobfuscator.clean(chunk));
        } catch (ex) {
          console.log(`Error: ${ex.description} at line ${ex.lineNumber}, col ${ex.column}`);
        }
      }
      process.stdout.write('etacsufbo > ');
    });
  }
}
