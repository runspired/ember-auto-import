// @ts-ignore
import syntax from 'babel-plugin-syntax-dynamic-import';
import { NodePath } from '@babel/core';
import { Import, CallExpression, callExpression, identifier, stringLiteral, Expression } from '@babel/types';
import Package from './package';

function emberAutoImport() {
  return {
    inherits: syntax,
    visitor: {
      Import(path: NodePath<Import>) {
        let call = path.parentPath as NodePath<CallExpression>;
        let arg = call.node.arguments[0];
        if (arg.type === 'StringLiteral') {
          let cat = Package.categorize(arg.value);
          if (cat === 'dep') {
            call.replaceWith(callExpression(identifier('emberAutoImportDynamic'), [arg]));
          }
        } else if (arg.type === 'TemplateLiteral') {
          let cat = Package.categorize(arg.quasis[0].value.cooked!, true);
          if (cat === 'dep') {
            call.replaceWith(
              callExpression(identifier('emberAutoImportDynamic'), [
                stringLiteral(arg.quasis.map(q => q.value.cooked).join('${e}')),
                ...(arg.expressions as Expression[]),
              ])
            );
          }
        }
      },
      CallExpression(path: NodePath<CallExpression>) {
        let callee = path.get('callee');

        if (callee.isIdentifier() && callee.referencesImport('@embroider/macros', 'importSync')) {
          let arg = path.node.arguments[0];
          if (arg.type === 'StringLiteral') {
            let cat = Package.categorize(arg.value);
            if (cat === 'url') {
              throw new Error('You cannot use importSync() with a URL.');
            }
            callee.replaceWith(identifier('require'));
          } else if (arg.type === 'TemplateLiteral') {
            let cat = Package.categorize(arg.quasis[0].value.cooked!, true);
            if (cat === 'url') {
              throw new Error('You cannot use importSync() with a URL.');
            }
            path.replaceWith(
              callExpression(identifier('emberAutoImportSync'), [
                stringLiteral(arg.quasis.map(q => q.value.cooked).join('${e}')),
                ...(arg.expressions as Expression[]),
              ])
            );
          }
        }
      },
    },
  };
}

emberAutoImport.baseDir = function () {
  return __dirname;
};

export = emberAutoImport;
