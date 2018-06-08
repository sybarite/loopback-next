// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const util = require('util');
const {isExtension, titleCase, kebabCase} = require('./utils');

function getTypeSpec(schema, options) {
  const objectTypeMapping = options.objectTypeMapping;
  let typeSpec = objectTypeMapping.get(schema);
  if (!typeSpec) {
    typeSpec = {};
    objectTypeMapping.set(schema, typeSpec);
  }
  return typeSpec;
}

function getDefault(schema, options) {
  let defaultVal = '';
  if (options && options.includeDefault && schema.default !== undefined) {
    defaultVal = ' = ' + JSON.stringify(schema.default);
  }
  return defaultVal;
}

/**
 * Map composite type (oneOf|anyOf|allOf)
 * @param {object} schema
 * @param {object} options
 */
function mapCompositeType(schema, options) {
  options = Object.assign({}, options, {includeDefault: false});
  const typeSpec = getTypeSpec(schema, options);
  let separator = '';
  let candidates = [];
  if (Array.isArray(schema.oneOf)) {
    separator = ' | ';
    candidates = schema.oneOf;
  } else if (Array.isArray(schema.anyOf)) {
    separator = ' | ';
    candidates = schema.anyOf;
  } else if (Array.isArray(schema.allOf)) {
    separator = ' & ';
    candidates = schema.allOf;
  }
  if (!separator) return undefined;
  const types = candidates.map(t => mapSchemaType(t, options));
  const members = Array.from(new Set(types));
  typeSpec.members = members;
  typeSpec.signature =
    members.map(m => m.signature).join(separator) + getDefault(schema, options);
  return typeSpec;
}

function mapArrayType(schema, options) {
  if (schema.type === 'array') {
    const opts = Object.assign({}, options, {includeDefault: false});
    const typeSpec = getTypeSpec(schema, options);
    const itemTypeSpec = mapSchemaType(schema.items, opts);
    typeSpec.name = itemTypeSpec.signature + '[]';
    typeSpec.signature =
      itemTypeSpec.signature + '[]' + getDefault(schema, options);
    typeSpec.itemType = itemTypeSpec;
    return typeSpec;
  }
  return undefined;
}

function mapObjectType(schema, options) {
  if (schema.type === 'object' || schema.properties) {
    const defaultVal = getDefault(schema, options);
    const typeSpec = getTypeSpec(schema, options);
    if (typeSpec.declaration) {
      if (typeSpec.name) {
        // Importing an existing model
        options.referencedModels.add(typeSpec);
      }
      return typeSpec;
    }
    const properties = [];
    const required = schema.required || [];
    for (const p in schema.properties) {
      const suffix = required.includes(p) ? '' : '?';
      const propertyType = mapSchemaType(
        schema.properties[p],
        Object.assign({}, options, {
          includeDefault: true,
        }),
      ).signature;
      properties.push({
        name: p,
        type: propertyType,
        signature: `${p + suffix}: ${propertyType};`,
        decoration: `@property({name: '${p}'})`,
      });
    }
    typeSpec.properties = properties;
    const propertySignatures = properties.map(p => p.signature);
    typeSpec.declaration = `{
  ${propertySignatures.join('\n  ')}
}`;
    typeSpec.signature = (typeSpec.name || typeSpec.declaration) + defaultVal;
    if (typeSpec.name) {
      // Importing an existing model
      options.referencedModels.add(typeSpec);
    }
    return typeSpec;
  }
  return undefined;
}

function mapPrimitiveType(schema, options) {
  /**
   * integer	integer	int32	    signed 32 bits
   * long	    integer	int64	    signed 64 bits
   * float	  number	float
   * double	  number	double
   * string	  string
   * byte	    string	byte	    base64 encoded characters
   * binary	  string	binary	  any sequence of octets
   * boolean	boolean
   * date	    string	date	    As defined by full-date - RFC3339
   * dateTime	string	date-time	As defined by date-time - RFC3339
   * password	string	password	A hint to UIs to obscure input.
   */
  let jsType = 'string';
  switch (schema.type) {
    case 'integer':
    case 'number':
      jsType = 'number';
      break;
    case 'boolean':
      jsType = 'boolean';
      break;
    case 'string':
      switch (schema.format) {
        case 'date':
        case 'date-time':
          jsType = 'Date';
          break;
        case 'binary':
          jsType = 'Buffer';
          break;
        case 'byte':
        case 'password':
          jsType = 'string';
          break;
      }
      break;
  }
  const defaultVal = getDefault(schema, options);
  return {name: jsType, signature: jsType + defaultVal};
}

/**
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#data-types
 *
 * @param {object} schema
 */
function mapSchemaType(schema, options) {
  options = options || {};
  if (!options.objectTypeMapping) {
    options.objectTypeMapping = new Map();
  }

  if (!options.referencedModels) {
    options.referencedModels = new Set();
  }

  const compositeType = mapCompositeType(schema, options);
  if (compositeType) {
    return compositeType;
  }

  const arrayType = mapArrayType(schema, options);
  if (arrayType) {
    return arrayType;
  }

  const objectType = mapObjectType(schema, options);
  if (objectType) {
    return objectType;
  }

  // Remove empty type spec
  options.objectTypeMapping.delete(schema);
  return mapPrimitiveType(schema, options);
}

/**
 * Generate model definitions from openapi spec
 * @param {object} apiSpec
 */
function generateModelSpecs(apiSpec, options) {
  options = options || {objectTypeMapping: new Map()};
  const objectTypeMapping = options.objectTypeMapping;

  const schemas =
    (apiSpec && apiSpec.components && apiSpec.components.schemas) || {};

  // First map schema objects to names
  for (const s in schemas) {
    if (isExtension(s)) continue;
    const className = titleCase(s);
    objectTypeMapping.set(schemas[s], {
      name: s,
      className,
      fileName: getModelFileName(s),
      properties: [],
    });
  }

  // Generate models from schema objects
  for (const s in schemas) {
    if (isExtension(s)) continue;
    const schema = schemas[s];
    const referencedModels = new Set();
    mapSchemaType(schema, {objectTypeMapping, referencedModels});
    const model = objectTypeMapping.get(schema);
    referencedModels.delete(model);
    if (referencedModels.size) {
      model.referencedModels = Array.from(referencedModels).map(m => ({
        name: m.name,
        className: m.className,
        fileName: m.fileName,
      }));
    }
  }
  return Array.from(objectTypeMapping.values());
}

function getModelFileName(modelName) {
  let name = modelName;
  if (modelName.endsWith('Model')) {
    name = modelName.substring(0, modelName.length - 'Model'.length);
  }
  return kebabCase(name) + '.model.ts';
}

module.exports = {
  mapSchemaType,
  generateModelSpecs,
  getModelFileName,
};
