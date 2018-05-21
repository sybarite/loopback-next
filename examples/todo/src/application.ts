// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ApplicationConfig, Provider, Constructor} from '@loopback/core';
import {RestApplication} from '@loopback/rest';
import {MySequence} from './sequence';
import {db} from './datasources/db.datasource';
import {geoLookup} from './datasources/geo-lookup.datasource';
import {GeoServiceProvider} from './services';

/* tslint:disable:no-unused-variable */
// Binding and Booter imports are required to infer types for BootMixin!
import {BootMixin, Booter, Binding} from '@loopback/boot';

// juggler imports are required to infer types for RepositoryMixin!
import {
  Class,
  Repository,
  RepositoryMixin,
  juggler,
} from '@loopback/repository';
/* tslint:enable:no-unused-variable */

export class TodoListApplication extends BootMixin(
  RepositoryMixin(RestApplication),
) {
  constructor(options?: ApplicationConfig) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.setupDatasources();
    this.setupServices();
  }

  setupDatasources() {
    // This will allow you to test your application without needing to
    // use a "real" datasource!
    const datasource =
      this.options && this.options.datasource
        ? new juggler.DataSource(this.options.datasource)
        : db;
    this.dataSource(datasource);

    // TODO(bajtos) How to allow app-level tests to provide
    // a datasource pointing to a stub service?
    this.dataSource(geoLookup);
  }

  setupServices() {
    this.service(GeoServiceProvider);
  }

  service<T>(provider: Constructor<Provider<T>>) {
    const key = `services.${provider.name.replace(/Provider$/, '')}`;
    this.bind(key).toProvider(provider);
  }
}
