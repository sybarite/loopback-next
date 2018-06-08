// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

const expect = require('@loopback/testlab').expect;
const {loadSpec} = require('../../../generators/openapi/spec-loader');
const {
  generateModelSpecs,
} = require('../../../generators/openapi/schema-helper');
const path = require('path');

describe('schema to model', () => {
  let usptoSpec, petstoreSpec;
  const uspto = path.join(__dirname, '../../fixtures/openapi/3.0/uspto.yaml');
  const petstore = path.join(
    __dirname,
    '../../fixtures/openapi/3.0/petstore-expanded.yaml',
  );

  before(async () => {
    usptoSpec = await loadSpec(uspto);
    petstoreSpec = await loadSpec(petstore);
  });

  it('generates models for uspto', () => {
    const objectTypeMapping = new Map();
    const models = generateModelSpecs(usptoSpec, {objectTypeMapping});
    expect(models).to.eql([
      {
        name: 'dataSetList',
        className: 'DataSetList',
        fileName: 'data-set-list.model.ts',
        properties: [
          {
            name: 'total',
            type: 'number',
            signature: 'total?: number;',
            decoration: "@property({name: 'total'})",
          },
          {
            name: 'apis',
            type:
              '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
              '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}[]',
            signature:
              'apis?: {\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
              '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}[];',
            decoration: "@property({name: 'apis'})",
          },
        ],
        declaration:
          '{\n  total?: number;\n  apis?: {\n  apiKey?: string;\n' +
          '  apiVersionNumber?: string;\n  apiUrl?: string;\n' +
          '  apiDocumentationUrl?: string;\n}[];\n}',
        signature: 'dataSetList',
      },
      {
        name:
          '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
          '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}[]',
        signature:
          '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
          '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}[]',
        itemType: {
          properties: [
            {
              name: 'apiKey',
              type: 'string',
              signature: 'apiKey?: string;',
              decoration: "@property({name: 'apiKey'})",
            },
            {
              name: 'apiVersionNumber',
              type: 'string',
              signature: 'apiVersionNumber?: string;',
              decoration: "@property({name: 'apiVersionNumber'})",
            },
            {
              name: 'apiUrl',
              type: 'string',
              signature: 'apiUrl?: string;',
              decoration: "@property({name: 'apiUrl'})",
            },
            {
              name: 'apiDocumentationUrl',
              type: 'string',
              signature: 'apiDocumentationUrl?: string;',
              decoration: "@property({name: 'apiDocumentationUrl'})",
            },
          ],
          declaration:
            '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
            '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}',
          signature:
            '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
            '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}',
        },
      },
      {
        properties: [
          {
            name: 'apiKey',
            type: 'string',
            signature: 'apiKey?: string;',
            decoration: "@property({name: 'apiKey'})",
          },
          {
            name: 'apiVersionNumber',
            type: 'string',
            signature: 'apiVersionNumber?: string;',
            decoration: "@property({name: 'apiVersionNumber'})",
          },
          {
            name: 'apiUrl',
            type: 'string',
            signature: 'apiUrl?: string;',
            decoration: "@property({name: 'apiUrl'})",
          },
          {
            name: 'apiDocumentationUrl',
            type: 'string',
            signature: 'apiDocumentationUrl?: string;',
            decoration: "@property({name: 'apiDocumentationUrl'})",
          },
        ],
        declaration:
          '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
          '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}',
        signature:
          '{\n  apiKey?: string;\n  apiVersionNumber?: string;\n' +
          '  apiUrl?: string;\n  apiDocumentationUrl?: string;\n}',
      },
    ]);
  });

  it('generates models for petstore', () => {
    const objectTypeMapping = new Map();
    const models = generateModelSpecs(petstoreSpec, {objectTypeMapping});
    expect(models).to.eql([
      {
        name: 'Pet',
        className: 'Pet',
        fileName: 'pet.model.ts',
        properties: [],
        members: [
          {
            name: 'NewPet',
            className: 'NewPet',
            fileName: 'new-pet.model.ts',
            properties: [
              {
                name: 'name',
                type: 'string',
                signature: 'name: string;',
                decoration: "@property({name: 'name'})",
              },
              {
                name: 'tag',
                type: 'string',
                signature: 'tag?: string;',
                decoration: "@property({name: 'tag'})",
              },
            ],
            declaration: '{\n  name: string;\n  tag?: string;\n}',
            signature: 'NewPet',
          },
          {
            properties: [
              {
                name: 'id',
                type: 'number',
                signature: 'id: number;',
                decoration: "@property({name: 'id'})",
              },
            ],
            declaration: '{\n  id: number;\n}',
            signature: '{\n  id: number;\n}',
          },
        ],
        signature: 'NewPet & {\n  id: number;\n}',
        referencedModels: [
          {
            name: 'NewPet',
            className: 'NewPet',
            fileName: 'new-pet.model.ts',
          },
        ],
      },
      {
        name: 'NewPet',
        className: 'NewPet',
        fileName: 'new-pet.model.ts',
        properties: [
          {
            name: 'name',
            type: 'string',
            signature: 'name: string;',
            decoration: "@property({name: 'name'})",
          },
          {
            name: 'tag',
            type: 'string',
            signature: 'tag?: string;',
            decoration: "@property({name: 'tag'})",
          },
        ],
        declaration: '{\n  name: string;\n  tag?: string;\n}',
        signature: 'NewPet',
      },
      {
        name: 'Error',
        className: 'Error',
        fileName: 'error.model.ts',
        properties: [
          {
            name: 'code',
            type: 'number',
            signature: 'code: number;',
            decoration: "@property({name: 'code'})",
          },
          {
            name: 'message',
            type: 'string',
            signature: 'message: string;',
            decoration: "@property({name: 'message'})",
          },
        ],
        declaration: '{\n  code: number;\n  message: string;\n}',
        signature: 'Error',
      },
      {
        properties: [
          {
            name: 'id',
            type: 'number',
            signature: 'id: number;',
            decoration: "@property({name: 'id'})",
          },
        ],
        declaration: '{\n  id: number;\n}',
        signature: '{\n  id: number;\n}',
      },
    ]);
  });
});
