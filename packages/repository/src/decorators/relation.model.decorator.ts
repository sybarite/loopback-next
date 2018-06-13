import {Entity} from '../model';
import {EntityCrudRepository} from '../repositories/repository';
import {Class} from '../common-types';
import {
  HasManyDefinition,
  hasManyRepositoryFactory,
  RelationDefinitionBase,
} from '../repositories/relation.factory';
import {RelationType, RELATIONS_KEY} from './relation.decorator';
import {
  inject,
  BindingKey,
  Context,
  Injection,
  MetadataInspector,
} from '@loopback/context';
import {DefaultCrudRepository} from '../repositories/legacy-juggler-bridge';

/**
 * Decorator for hasMany
 * @param targetRepo
 * @returns {(target:any, key:string)}
 */
export function hasManyRepository<T extends Entity>(
  targetRepo: Class<EntityCrudRepository<T, typeof Entity.prototype.id>>,
) {
  return function(target: Object, key: string) {
    // function orders(id: Partial<typeof target>) {
    //   Object.assign({}, {keyTo: 'customerId'}, rel);
    //   return hasManyRepositoryFactory(id, rel, targetRepo);
    // }
    // Object.defineProperty(target, key, {
    //   value: orders,
    //   enumerable: false,
    //   configurable: false,
    //   writable: false,
    // });
    // PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel)(target, key);
    inject(
      BindingKey.create<typeof targetRepo>(`repositories.${targetRepo.name}`),
      {},
      resolver,
    )(target, key);
  };

  async function resolver(ctx: Context, injection: Injection) {
    // const meta = Object.assign({}, injection.metadata);
    const tRepo = await ctx.get<
      DefaultCrudRepository<Entity, typeof Entity.prototype.id>
    >(injection.bindingKey);
    const targetModel = tRepo.entityClass;
    const allMeta = MetadataInspector.getAllPropertyMetadata<
      RelationDefinitionBase
    >(RELATIONS_KEY, targetModel)!;
    let meta: HasManyDefinition;
    // what aboot multiple hasMany decorations?!?!?!?!?!?!
    Object.values(allMeta).forEach(value => {
      if (value.type === RelationType.hasMany) {
        meta = value as HasManyDefinition;
      }
    });
    return function(constraint: Partial<Entity>) {
      return hasManyRepositoryFactory(
        constraint[meta.keyTo],
        meta,
        tRepo as DefaultCrudRepository<Entity, typeof Entity.prototype.id>,
      );
    };
  }
}
