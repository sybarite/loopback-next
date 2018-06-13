import {expect} from '@loopback/testlab';
import {Entity} from '../../../src/model';
import {hasMany, RELATIONS_KEY, RelationType} from '../../../src';
import {MetadataInspector} from '@loopback/context';

describe('relation decorator', () => {
  it('hasMany', () => {
    const meta = MetadataInspector.getPropertyMetadata(
      RELATIONS_KEY,
      AddressBook.prototype,
      'addresses',
    );
    expect(meta).to.eql({
      type: RelationType.hasMany,
      modelFrom: Address,
      keyTo: 'addresses',
    });
  });

  class Address extends Entity {
    addressId: number;
    street: string;
    province: string;
  }

  class AddressBook extends Entity {
    id: number;
    @hasMany({modelFrom: Address})
    addresses: Address[];
  }
});
