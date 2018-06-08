// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const fs = require('fs');
const util = require('util');
const _ = require('lodash');

const utils = require('../../lib/utils');
const debug = require('../../lib/debug')('openapi-generator');

/**
 * Convert a string to title case
 * @param {string} str
 */
function titleCase(str) {
  return _.startCase(_.camelCase(str)).replace(/\s/g, '');
}

/**
 * Check if a given key is openapi extension (x-)
 * @param {string} key
 */
function isExtension(key) {
  return typeof key === 'string' && key.startsWith('x-');
}

/**
 * Dump the json object for debugging
 * @param {string} msg Message
 * @param {object} obj The json object
 */
function debugJson(msg, obj) {
  debug('%s: %s', msg, JSON.stringify(obj, null, 2));
}

/**
 * Validate a url or file path for the open api spec
 * @param {string} specUrlStr
 */
function validateUrlOrFile(specUrlStr) {
  if (!specUrlStr) {
    return 'API spec url or file path is required.';
  }
  var specUrl = url.parse(specUrlStr);
  if (specUrl.protocol === 'http:' || specUrl.protocol === 'https:') {
    return true;
  } else {
    var stat = fs.existsSync(specUrlStr) && fs.statSync(specUrlStr);
    if (stat && stat.isFile()) {
      return true;
    } else {
      return util.format('Path %s is not a file.', specUrlStr);
    }
  }
}

module.exports = {
  isExtension,
  titleCase,
  debug,
  debugJson,
  kebabCase: utils.kebabCase,
  camelCase: _.camelCase,
};
