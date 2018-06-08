// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const chalk = require('chalk');
const SwaggerParser = require('swagger-parser');
const swagger2openapi = require('swagger2openapi');
const {debugJson} = require('./utils');
const {generateControllerSpecs} = require('./spec-helper');
const {generateModelSpecs} = require('./schema-helper');

/**
 * Load swagger specs from the given url or file path; handle yml or json
 * @param {String} specUrlStr The url or file path to the swagger spec
 * @param cb
 */
async function loadSpec(specUrlStr, log) {
  if (typeof log === 'function') {
    log(chalk.blue('Loading ' + specUrlStr + '...'));
  }
  const parser = new SwaggerParser();
  let spec = await parser.parse(specUrlStr);
  if (spec.swagger === '2.0') {
    debugJson('Swagger spec loaded: ', spec);
    spec = (await swagger2openapi.convertObj(spec, {patch: true})).openapi;
    debugJson('OpenAPI spec converted from Swagger: ', spec);
  } else if (spec.openapi) {
    debugJson('OpenAPI spec loaded: ', spec);
  }

  // Validate and deference the spec
  spec = await parser.validate(spec, {
    validate: {
      spec: false, // Don't validate against the Swagger spec
    },
  });

  return spec;
}

async function loadAndBuildSpec(url, log) {
  const apiSpec = await loadSpec(url, log);
  const options = {objectTypeMapping: new Map()};
  const modelSpecs = generateModelSpecs(apiSpec, options);
  const controllerSpecs = generateControllerSpecs(apiSpec, options);
  return {
    apiSpec,
    modelSpecs,
    controllerSpecs,
  };
}

module.exports = {
  loadSpec,
  loadAndBuildSpec,
};
