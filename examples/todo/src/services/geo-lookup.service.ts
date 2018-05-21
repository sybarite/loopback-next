// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getService, juggler} from '@loopback/service-proxy';
import {inject, Provider} from '@loopback/core';
import {geoLookup} from '../datasources/geo-lookup.datasource';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoService {
  geocode(street: string, city: string, zipcode: string): Promise<GeoPoint>;
}

export class GeoServiceProvider implements Provider<GeoService> {
  constructor(
    @inject('datasources.geoLookup')
    protected datasource: juggler.DataSource = geoLookup,
  ) {}

  value(): GeoService {
    return getService(this.datasource);
  }
}
