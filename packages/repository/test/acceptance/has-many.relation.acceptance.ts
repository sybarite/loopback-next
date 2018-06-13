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
  RepositoryMixin,
} from '../..';
import {expect} from '@loopback/testlab';
import {
  MetadataInspector,
  MetadataAccessor,
  Reflector,
} from '@loopback/context';
import {Application} from '@loopback/core';
import {hasManyRepository} from '../../src/decorators/relation.model.decorator';

describe('HasMany relation', () => {
  // Given a Customer and Order models - see definitions at the bottom

  beforeEach(givenCrudRepositoriesForCustomerAndOrder);

  let existingCustomerId: number;
  //FIXME: this should be inferred from relational decorators
  let customerHasManyOrdersRelationMeta: HasManyDefinition;

  beforeEach(async () => {
    existingCustomerId = (await givenPersistedCustomerInstance()).id;
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
    class TestController {
      constructor(
        @repository(CustomerRepository) protected cusRepo: CustomerRepository,
      ) {}

      async createCustomerOrders(
        customerId: number,
        orderData: Partial<Order>,
      ): Promise<Order> {
        return await this.cusRepo.orders({id: customerId}).create(orderData);
      }
    }
    class TestApp extends RepositoryMixin(Application) {}
    const app = new TestApp();
    app.repository(CustomerRepository);
    app.repository(OrderRepository);
    app.controller(TestController);
    const controller = await app.get<TestController>(
      'controllers.TestController',
    );

    //then
    const order = await controller.createCustomerOrders(1, {
      description: 'order 1',
    });
    expect(order.toObject()).to.containDeep({
      customerId: 1,
      description: 'order 1',
    });
    const persisted = await orderRepo.findById(order.id);
    expect(persisted.toObject()).to.deepEqual(order.toObject());
  });

  //--- HELPERS ---//

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
  }

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

    @property.array(Order)
    @hasMany()
    orders: Order[];
  }

  let customerRepo: CustomerRepository;

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
    constructor() {
      const db = new juggler.DataSource({connector: 'memory'});
      super(Customer, db);
    }
    // We should be able to inject a factory of OrderRepository by name or instance
    // and infer `Order` from the `OrderRepository`
    @hasManyRepository(OrderRepository) // The argument can be an object to pass in more info
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
});
