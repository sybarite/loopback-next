// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as path from 'path';

const dsConfigPath = path.resolve(
  __dirname,
  '../../../config/datasources.json',
);

export const {db, geoLookup} = require(dsConfigPath);
