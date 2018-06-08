// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const fs = require('fs');
const util = require('util');

const debug = require('../../lib/debug')('openapi-generator');
const {mapSchemaType} = require('./schema-helper');
const {
  isExtension,
  titleCase,
  debugJson,
  kebabCase,
  camelCase,
} = require('./utils');

/**
 * Group operations by controller class name
 * @param {object} apiSpec OpenAPI 3.x spec
 */
function groupOperationsByController(apiSpec) {
  const operationsMapByController = {};
  if (apiSpec.paths == null) return operationsMapByController;
  for (const path in apiSpec.paths) {
    if (isExtension(path)) continue;
    debug('Path: %s', path);
    for (const verb in apiSpec.paths[path]) {
      if (isExtension(verb)) continue;
      debug('Verb: %s', verb);
      const op = apiSpec.paths[path][verb];
      const operation = {
        path,
        verb,
        spec: op,
      };
      debugJson('Operation', operation);
      // Default to `openapi` if no tags are present
      let controllers = ['OpenApiController'];
      if (op['x-controller-name']) {
        controllers = [op['x-controller-name']];
      } else if (op.tags) {
        controllers = op.tags.map(t => titleCase(t + 'Controller'));
      }
      controllers.forEach((c, index) => {
        /**
         * type ControllerSpec = {
         *   tag?: string;
         *   operations: Operation[]
         * }
         */
        let controllerSpec = operationsMapByController[c];
        if (!controllerSpec) {
          controllerSpec = {operations: [operation]};
          if (op.tags && op.tags[index]) {
            controllerSpec.tag = op.tags[index];
          }
          operationsMapByController[c] = controllerSpec;
        } else {
          controllerSpec.operations.push(operation);
        }
      });
    }
  }
  return operationsMapByController;
}

/**
 * Get the method name for an operation spec
 * @param {object} opSpec OpenAPI operation spec
 */
function getMethodName(opSpec) {
  return opSpec['x-method-name'] || camelCase(opSpec.operationId);
}

/**
 * Build method spec for an operation
 * @param {object} OpenAPI operation
 */
function buildMethodSpec(op, options) {
  const methodName = getMethodName(op.spec);
  let args = [];
  const parameters = op.spec.parameters;
  if (parameters) {
    args = parameters.map(p => {
      const name = camelCase(p.name);
      const pType = mapSchemaType(p, options);
      return `@param({name: '${p.name}', in: '${p.in}'}) ${name}: ${
        pType.signature
      }`;
    });
  }
  let returnType = 'any';
  const responses = op.spec.responses;
  if (responses) {
    for (const r in responses) {
      if (isExtension(r)) continue;
      const content = responses[r].content;
      for (const t in content) {
        if (t === '200') {
          returnType = mapSchemaType(content[t], options).signature;
        }
      }
    }
  }
  const signature = `${methodName}(${args.join(', ')}): ${returnType}`;
  return {
    description: op.spec.description,
    decoration: `@operation('${op.verb}', '${op.path}')`,
    signature,
  };
}

/**
 * Build an array of controller specs
 * @param {object} operationsMapByController
 */
function buildControllerSpecs(operationsMapByController, options) {
  const controllerSpecs = [];
  for (const controller in operationsMapByController) {
    const referencedModels = [];
    const opts = Object.assign({}, options, {referencedModels});
    const controllerSpec = {
      tag: operationsMapByController[controller].tag,
      className: controller,
      methods: operationsMapByController[controller].operations.map(op =>
        buildMethodSpec(op, opts),
      ),
    };
    controllerSpec.referencedModels = referencedModels;
    controllerSpecs.push(controllerSpec);
  }
  return controllerSpecs;
}

/**
 * Generate an array of controller specs for the openapi spec
 * @param {object} apiSpec
 */
function generateControllerSpecs(apiSpec, options) {
  const operationsMapByController = groupOperationsByController(apiSpec);
  return buildControllerSpecs(operationsMapByController, options);
}

function getControllerFileName(controllerName) {
  let name = controllerName;
  if (controllerName.endsWith('Controller')) {
    name = controllerName.substring(
      0,
      controllerName.length - 'Controller'.length,
    );
  }
  return kebabCase(name) + '.controller.ts';
}

module.exports = {
  getControllerFileName,
  generateControllerSpecs,
};
