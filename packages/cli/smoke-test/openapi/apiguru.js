// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const {supertest} = require('@loopback/testlab');

describe('Real-world APIs', () => {
  'use strict';

  var realWorldAPIs = [];

  before(async function() {
    // This hook sometimes takes several seconds, due to the large download
    this.timeout(10000);

    // Download a list of over 1500 real-world Swagger APIs from apis.guru
    const res = await supertest('https://api.apis.guru')
      .get('/v2/list.json')
      .expect(200);
    if (!res.ok) {
      throw new Error('Unable to download API listing from apis.guru');
    }

    // Remove certain APIs that are known to cause problems
    var apis = res.body;

    // GitHub's CORS policy blocks this request
    delete apis['googleapis.com:adsense'];

    // These APIs cause infinite loops in json-schema-ref-parser.  Still investigating.
    // https://github.com/BigstickCarpet/json-schema-ref-parser/issues/56
    delete apis['bungie.net'];
    delete apis['stripe.com'];

    // Flatten the list, so there's an API object for every API version
    realWorldAPIs = [];
    for (const apiName in apis) {
      for (const version in apis[apiName].versions) {
        const api = apis[apiName].versions[version];
        console.log(api.swaggerUrl);
        console.log(api.swaggerYamlUrl);
        api.name = apiName;
        api.version = version;
        realWorldAPIs.push(api);
      }
    }
  });

  it('test api', () => {});
});
