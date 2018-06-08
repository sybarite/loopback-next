// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {EntityCrudRepository} from './repository';
import {
  constrainDataObject,
  constrainFilter,
  constrainWhere,
} from './constraint-utils';
import {DataObject, AnyObject, Options} from '../common-types';
import {Entity} from '../model';
import {Filter, Where} from '../query';

/**
 * CRUD operations for a target repository of a HasMany relation
 */
export interface HasManyEntityCrudRepository<T extends Entity, ID> {
  /**
   * Create a target model instance
   * @param targetModelData The target model data
   * @param options Options for the operation
   * @returns A promise which resolves to the newly created target model instance
   */
  create(targetModelData: Partial<T>, options?: Options): Promise<T>;
  /**
   * Find target model instance(s)
   * @param Filter A filter object for where, order, limit, etc.
   * @param options Options for the operation
   * @returns A promise which resolves with the found target instance(s)
   */
  find(filter?: Filter, options?: Options): Promise<T[]>;
  /**
   * Patch target model instance
   * @param entity
   * @param options
   */
  patch(entity: DataObject<T>, options?: Options): Promise<boolean>;
  /**
   * Delete target model instance
   * @param entity
   * @param options
   */
  delete(entity: DataObject<T>, options?: Options): Promise<boolean>;
  /**
   * Replace target model instance
   * @param entity
   * @param options
   */
  replace(entity: DataObject<T>, options?: Options): Promise<boolean>;
  /**
   * Create multiple target model instances
   * @param dataObjects
   */
  createAll(dataObjects: DataObject<T>[]): Promise<T[]>;
  /**
   * Delete multiple target model instances
   * @param where Instances within the where scope are deleted
   * @param options
   */
  deleteAll(where?: Where, options?: Options): Promise<number>;
  /**
   * Patch multiple target model instances
   * @param dataObject The fields and their new values to patch
   * @param where Instances within the where scope are patched
   * @param options
   */
  patchAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<number>;
}

export class DefaultHasManyEntityCrudRepository<
  T extends Entity,
  TargetRepository extends EntityCrudRepository<T, typeof Entity.prototype.id>,
  ID
> implements HasManyEntityCrudRepository<T, ID> {
  /**
   * Constructor of DefaultHasManyEntityCrudRepository
   * @param sourceInstance the source model instance
   * @param targetRepository the related target model repository instance
   * @param foreignKeyName the foreign key name to constrain the target repository
   * instance
   */
  constructor(
    public targetRepository: TargetRepository,
    public constraint: AnyObject,
  ) {}

  async create(targetModelData: Partial<T>, options?: Options): Promise<T> {
    return await this.targetRepository.create(
      constrainDataObject(targetModelData, this.constraint) as Partial<T>,
      options,
    );
  }

  async find(filter?: Filter, options?: Options): Promise<T[]> {
    return await this.targetRepository.find(
      constrainFilter(filter, this.constraint),
      options,
    );
  }

  async patch(entity: DataObject<T>, options?: Options): Promise<boolean> {
    return await this.targetRepository.update(
      constrainDataObject(entity, this.constraint),
      options,
    );
  }

  async delete(entity: DataObject<T>, options?: Options): Promise<boolean> {
    return await this.targetRepository.delete(
      constrainDataObject(entity, this.constraint),
      options,
    );
  }

  async replace(entity: DataObject<T>, options?: Options): Promise<boolean> {
    return await this.targetRepository.replaceById(
      entity.getId(),
      constrainDataObject(entity, this.constraint),
      options,
    );
  }

  async createAll(entities: DataObject<T>[]): Promise<T[]> {
    entities = entities.map(e => constrainDataObject(e, this.constraint));
    return await this.targetRepository.createAll(entities);
  }

  async deleteAll(where?: Where, options?: Options): Promise<number> {
    return await this.targetRepository.deleteAll(
      constrainWhere(where, this.constraint),
      options,
    );
  }

  async patchAll(
    dataObject: DataObject<T>,
    where?: Where,
    options?: Options,
  ): Promise<number> {
    return await this.targetRepository.updateAll(
      dataObject,
      constrainWhere(where, this.constraint),
      options,
    );
  }
}
