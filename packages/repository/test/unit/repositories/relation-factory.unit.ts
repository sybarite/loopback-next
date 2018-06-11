import {
  relationRepositoryFactory,
  juggler,
  DefaultCrudRepository,
  Entity,
  RelationDefinitionBase,
  RelationType,
  ModelDefinition,
  HasManyDefinition,
} from '../../../src';
import * as RelationFactoryNamespace from '../../../src/repositories/relation.repository'; // needed to spy on the factory function
import {sinon} from '@loopback/testlab';

describe('relationRepositoryFactory', () => {
  const instanceId = 4;
  let meta: RelationDefinitionBase;
  let relationTestRepo: DefaultCrudRepository<Entity, number>;
  let db: juggler.DataSource;

  before(givenDataSource);
  before(givenTestRepository);

  it('calls DefaultHasManyEntityCrudRepository constructor when given HasMany metadata', () => {
    meta = {
      type: RelationType.hasMany,
      keyTo: 'hasManyId',
    };
    const spy = sinon.spy(
      RelationFactoryNamespace,
      'DefaultHasManyEntityCrudRepository',
    );

    relationRepositoryFactory(
      instanceId,
      meta as HasManyDefinition,
      relationTestRepo,
    );

    sinon.assert.calledWithNew(spy);
    sinon.assert.calledWith(spy, relationTestRepo, {hasManyId: instanceId});
  });

  function givenDataSource() {
    db = new juggler.DataSource({connector: 'memory'});
  }

  function givenTestRepository() {
    relationTestRepo = new DefaultCrudRepository(
      class TestModel extends Entity {
        static definition = new ModelDefinition({
          name: 'TestModel',
          properties: {
            testId: {type: 'string', id: true},
          },
        });
      },
      db,
    );
  }
});
