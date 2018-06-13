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
  DefaultHasManyEntityCrudRepository,
  hasMany,
  RELATIONS_KEY,
  ModelMetadataHelper,
  repository,
} from '../..';
import {expect} from '@loopback/testlab';
import {
  MetadataInspector,
  MetadataAccessor,
  Reflector,
} from '@loopback/context';

describe('HasMany relation', () => {
  // Given a Customer and Order models - see definitions at the bottom

  beforeEach(givenCrudRepositoriesForCustomerAndOrder);

  let existingCustomerId: number;
  //FIXME: this should be inferred from relational decorators
  let customerHasManyOrdersRelationMeta: HasManyDefinition;

  beforeEach(async () => {
    existingCustomerId = (await givenPersistedCustomerInstance()).id;
    customerHasManyOrdersRelationMeta = givenHasManyRelationMetadata();
  });

  it('can create an instance of the related model', async () => {
    // A controller method - CustomerOrdersController.create()
    // customerRepo and orderRepo would be injected via constructor arguments
    async function create(customerId: number, orderData: Partial<Order>) {
      // Ideally, we would like to write
      // customerRepo.orders.create(customerId, orderData);
      // or customerRepo.orders({id: customerId}).*
      // The initial "involved" implementation is below

      //FIXME: should be automagically instantiated via DI or other means
      const customerOrders = hasManyRepositoryFactory(
        customerId,
        customerHasManyOrdersRelationMeta,
        orderRepo,
      );
      return await customerOrders.create(orderData);
    }

    const description = 'an order desc';
    const order = await create(existingCustomerId, {description});

    expect(order.toObject()).to.containDeep({
      customerId: existingCustomerId,
      description,
    });
    const persisted = await orderRepo.findById(order.id);
    expect(persisted.toObject()).to.deepEqual(order.toObject());
  });

  // This should be enforced by the database to avoid race conditions
  it.skip('reject create request when the customer does not exist');

  it.only('create related models', async () => {
    async function createCustomerOrders(
      customerId: number,
      orderData: Partial<Order>,
    ): Promise<Order> {
      return await customerRepo.orders({id: customerId}).create(orderData);
    }
    //then
    const order = await createCustomerOrders(1, {description: 'order 1'});
    expect(order.toObject()).to.containDeep({
      customerId: 1,
      description: 'order 1',
    });
    const persisted = await orderRepo.findById(order.id);
    expect(persisted.toObject()).to.deepEqual(order.toObject());
  });

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
      type: 'number',
      required: true,
    })
    customerId: number;
  }

  let customerRepo: CustomerRepository;

  async function getCustomerOrders(customerId: number): Promise<Order[]> {
    return await customerRepo.orders({id: customerId}).find();
  }

  class OrderRepository extends DefaultCrudRepository<
    Order,
    typeof Order.prototype.id
  > {
    constructor() {
      const db = new juggler.DataSource({connector: 'memory'});
      super(Order, db);
    }
  }

  class CustomerRepository extends DefaultCrudRepository<
    Customer,
    typeof Customer.prototype.id
  > {
    public targetRepo: OrderRepository;
    // @repository(OrderRepository) protected targetRepo: OrderRepository;
    constructor() {
      const db = new juggler.DataSource({connector: 'memory'});
      super(Customer, db);
      this.targetRepo = new OrderRepository();
    }
    // We should be able to inject a factory of OrderRepository by name or instance
    // and infer `Order` from the `OrderRepository`
    @hasMany(this.targetRepo) // The argument can be an object to pass in more info
    public readonly orders: (key: Partial<Customer>) => OrderRepository;
  }

  let orderRepo: EntityCrudRepository<Order, typeof Order.prototype.id>;

  function givenCrudRepositoriesForCustomerAndOrder() {
    customerRepo = new CustomerRepository();
    orderRepo = new OrderRepository();
  }

  async function givenPersistedCustomerInstance() {
    return customerRepo.create({name: 'a customer'});
  }

  function givenHasManyRelationMetadata(): HasManyDefinition {
    return {
      keyTo: 'customerId',
      type: RelationType.hasMany,
    };
  }
});
