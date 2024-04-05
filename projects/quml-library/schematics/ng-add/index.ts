import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  NodePackageInstallTask,
  RunSchematicTask
} from '@angular-devkit/schematics/tasks';

import { getWorkspace } from '@schematics/angular/utility/workspace';

import { addPackageToPackageJson } from '../utils/package-config';
import * as messages from './messages';
import { Schema } from './schema';

const VERSIONS = {
  // These required peer-dependency will get installed on build time if not exist
  '@project-sunbird/client-services': '^5.1.2',
  '@project-sunbird/sb-styles': '0.0.16',
  'bootstrap': '^5.3.3',
  'jquery': '^3.7.1',
  'lodash-es': '^4.17.21',
  "katex": "^0.16.10",
  'ngx-bootstrap': '^11.0.0'
};

/**
 * This is executed when `ng add @project-sunbird/sunbird-quml-player` is run.
 * It installs all dependencies in the 'package.json' and runs 'ng-add-setup-project' schematic.
 */
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {

    context.logger.info("Setting up quml-player...");
    // Checking that project exists
    const { project } = options;
    if (project) {
      const workspace = await getWorkspace(tree);
      const projectWorkspace = workspace.projects.get(project);

      if (!projectWorkspace) {
        throw new SchematicsException(messages.noProject(project));
      }
    }

    context.logger.info('Installing dependencies...');
    for(const modulePackage in VERSIONS) {
      addPackageToPackageJson(tree, modulePackage, VERSIONS[modulePackage as keyof typeof VERSIONS]);
    }
    context.addTask(new RunSchematicTask('ng-add-setup-project', options), [
      context.addTask(new NodePackageInstallTask()),
    ]);
  };
}
