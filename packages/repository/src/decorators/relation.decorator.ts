// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Class} from '../common-types';
import {Entity, Model} from '../model';

import {
  PropertyDecoratorFactory,
  Context,
  inject,
  Injection,
  BindingKey,
} from '@loopback/context';
import {DefaultCrudRepository} from '../repositories/legacy-juggler-bridge';
import {repository} from './repository.decorator';
import {Repository, EntityCrudRepository} from '../repositories/repository';
import {
  DefaultHasManyEntityCrudRepository,
  hasManyRepositoryFactory,
  HasManyDefinition,
  RelationDefinitionBase,
} from '..';

// tslint:disable:no-any

export enum RelationType {
  belongsTo,
  hasOne,
  hasMany,
  embedsOne,
  embedsMany,
  referencesOne,
  referencesMany,
}

export const RELATIONS_KEY = 'loopback:relations';

export class RelationMetadata {
  type: RelationType;
  target: string | Class<Entity>;
  as: string;
}

/**
 * Decorator for relations
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function relation(definition?: Object) {
  // Apply relation definition to the model class
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, definition);
}

/**
 * Decorator for belongsTo
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function belongsTo(definition?: Object) {
  // Apply model definition to the model class
  const rel = Object.assign({type: RelationType.belongsTo}, definition);
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel);
}

/**
 * Decorator for hasOne
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function hasOne(definition?: Object) {
  const rel = Object.assign({type: RelationType.hasOne}, definition);
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel);
}

export function hasMany(definition?: Partial<HasManyDefinition>) {
  return function(target: Object, key: string) {
    const meta = Object.assign(
      {
        type: RelationType.hasMany,
        keyTo: key,
      },
      definition,
    );
    PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, meta)(target, key);
  };
}

/**
 * Decorator for embedsOne
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function embedsOne(definition?: Object) {
  const rel = Object.assign({type: RelationType.embedsOne}, definition);
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel);
}

/**
 * Decorator for embedsMany
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function embedsMany(definition?: Object) {
  const rel = Object.assign({type: RelationType.embedsMany}, definition);
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel);
}

/**
 * Decorator for referencesOne
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function referencesOne(definition?: Object) {
  const rel = Object.assign({type: RelationType.referencesOne}, definition);
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel);
}

/**
 * Decorator for referencesMany
 * @param definition
 * @returns {(target:any, key:string)}
 */
export function referencesMany(definition?: Object) {
  const rel = Object.assign({type: RelationType.referencesMany}, definition);
  return PropertyDecoratorFactory.createDecorator(RELATIONS_KEY, rel);
}
