// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  model,
  property,
  Entity,
  DefaultCrudRepository,
  juggler,
  EntityCrudRepository,
  hasManyRepositoryFactory,
  HasManyDefinition,
  RelationType,
  HasManyEntityCrudRepository,
} from '../..';
import {expect} from '@loopback/testlab';

describe('HasMany relation', () => {
  // Given a Customer and Order models - see definitions at the bottom

  beforeEach(givenCrudRepositoriesForCustomerAndOrder);

  let existingCustomerId: number;
  //FIXME: this should be inferred from relational decorators
  let customerHasManyOrdersRelationMeta: HasManyDefinition;
  let customerOrders: HasManyEntityCrudRepository<Order, number>;

  beforeEach(async () => {
    existingCustomerId = (await givenPersistedCustomerInstance()).id;
    customerHasManyOrdersRelationMeta = givenHasManyRelationMetadata();
    // Ideally, we would like to write
    // customerRepo.orders.create(customerId, orderData);
    // or customerRepo.orders({id: customerId}).*
    // The initial "involved" implementation is below

    //FIXME: should be automagically instantiated via DI or other means
    customerOrders = hasManyRepositoryFactory(
      existingCustomerId,
      customerHasManyOrdersRelationMeta,
      orderRepo,
    );
  });

  it('can create an instance of the related model', async () => {
    // A controller method - CustomerOrdersController.create()
    // customerRepo and orderRepo would be injected via constructor arguments
    async function create(customerId: number, orderData: Partial<Order>) {
      return await customerOrders.create(orderData);
    }

    const description = 'an order desc';
    const order = await customerOrders.create({description});

    expect(order.toObject()).to.containDeep({
      customerId: existingCustomerId,
      description,
    });
    const persisted = await orderRepo.findById(order.id);
    expect(persisted.toObject()).to.deepEqual(order.toObject());
  });

  it('can patch an instance of the related model', async () => {
    const originalData = {
      description: 'an order',
      isDelivered: false,
    };
    const order = await customerOrders.create(originalData);

    const fieldToPatch = {
      isDelivered: true,
    };
    const newData = Object.assign({id: order.id}, fieldToPatch);
    const isPatched = await customerOrders.patch(toOrderEntity(newData));
    expect(isPatched).to.be.true;

    const expectedResult = {
      id: order.id,
      description: 'an order',
      isDelivered: true,
      customerId: existingCustomerId,
    };
    const patchedData = await orderRepo.findById(order.id);
    expect(patchedData.toObject()).to.deepEqual(expectedResult);
  });

  it('can delete an instance of the related model', async () => {
    const originalData = {
      description: 'an order',
    };
    const order = await customerOrders.create(originalData);
    delete order.customerId;

    const isDeleted = await customerOrders.delete(toOrderEntity(order));
    expect(isDeleted).to.be.true;

    async function findDeletedData() {
      return await orderRepo.findById(order.id);
    }
    await expect(findDeletedData()).to.be.rejectedWith(
      /no Order found with id/,
    );
  });

  it('can replace an instance of the related model', async () => {
    const originalData = {
      description: 'an order',
      isDelivered: false,
    };
    const order = await customerOrders.create(originalData);

    const newData = {
      id: order.id,
      description: 'new order',
    };
    const newEntity = toOrderEntity(newData);
    const isReplaced = await customerOrders.replace(newEntity);
    expect(isReplaced).to.be.true;

    const expectedResult = {
      id: order.id,
      description: 'new order',
      // @jannyhou: investigating why it's undefined, pretty sure it's not caused by `constrainData`
      isDelivered: undefined,
      customerId: existingCustomerId,
    };
    const replacedData = await orderRepo.findById(order.id);
    expect(replacedData.toObject()).to.deepEqual(expectedResult);
  });

  it('can run batch operations', async () => {
    // write test in one `it` to save time
    // Will split them into 3 seperate `it` tests
    // if we decide to keep them
    const originalData = [
      toOrderEntity({description: 'order 1'}),
      toOrderEntity({description: 'order 2'}),
    ];
    await testCreateAll();
    await testPatchAll();
    await testDeleteAll();

    async function testCreateAll() {
      const createdData = await customerOrders.createAll(originalData);
      originalData.forEach(order => {
        const createdOrder = createdData.filter(d => {
          return d.description === order.description;
        });
        expect(createdOrder).to.have.lengthOf(1);
        expect(createdOrder[0].customerId).to.eql(existingCustomerId);
      });
    }

    async function testPatchAll() {
      const patchObject = {description: 'new order'};
      const arePatched = await customerOrders.patchAll(patchObject);
      expect(arePatched).to.be.true;
      const patchedItems = await customerOrders.find();
      expect(patchedItems).to.have.length(2);
      patchedItems.forEach(order => {
        expect(order.description).to.eql('new order');
        expect(order.customerId).to.eql(existingCustomerId);
      });
    }

    async function testDeleteAll() {
      await customerOrders.deleteAll();
      const relatedOrders = await customerOrders.find();
      expect(relatedOrders).to.be.empty;
    }
  });

  // This should be enforced by the database to avoid race conditions
  it.skip('reject create request when the customer does not exist');

  //--- HELPERS ---//

  @model()
  class Customer extends Entity {
    @property({
      type: 'number',
      id: true,
    })
    id: number;

    @property({
      type: 'string',
    })
    name: string;
  }

  @model()
  class Order extends Entity {
    @property({
      type: 'number',
      id: true,
    })
    id: number;

    @property({
      type: 'string',
      required: true,
    })
    description: string;

    @property({
      type: 'boolean',
      required: false,
    })
    isDelivered: boolean;

    @property({
      type: 'number',
      required: true,
    })
    customerId: number;
  }

  let customerRepo: EntityCrudRepository<
    Customer,
    typeof Customer.prototype.id
  >;
  let orderRepo: EntityCrudRepository<Order, typeof Order.prototype.id>;
  function givenCrudRepositoriesForCustomerAndOrder() {
    const db = new juggler.DataSource({connector: 'memory'});

    customerRepo = new DefaultCrudRepository(Customer, db);
    orderRepo = new DefaultCrudRepository(Order, db);
  }

  async function givenPersistedCustomerInstance() {
    return customerRepo.create({name: 'a customer'});
  }

  function givenHasManyRelationMetadata(): HasManyDefinition {
    return {
      modelFrom: Customer,
      keyFrom: 'id',
      keyTo: 'customerId',
      type: RelationType.hasMany,
    };
  }

  function toOrderEntity(data: Partial<Order>) {
    return new Order(data);
  }
});
