// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {GeoService, GeoServiceProvider} from '../../../src/services';
import {expect} from '@loopback/testlab';

describe('GeoLookupService', () => {
  let service: GeoService;
  beforeEach(givenGeoService);

  it('resolves an address to a geo point', async () => {
    const point = await service.geocode(
      '1 New Orchard Road',
      'Armonk',
      '10504',
    );

    expect(point).to.deepEqual({
      lat: 41.1083018,
      lng: -73.7204677,
    });
  });

  function givenGeoService() {
    service = new GeoServiceProvider().value();
  }
});
