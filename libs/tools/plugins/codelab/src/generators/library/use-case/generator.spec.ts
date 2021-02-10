import { join } from 'path'
import { Tree } from '@angular-devkit/schematics'
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing'
import { createEmptyWorkspace } from '@nrwl/workspace/testing'
import { normalizeOptions } from '../domain-module/generator'
import { DomainModuleSchematicSchema } from '../domain-module/schema'
import { UseCaseSchematicSchema } from './schema'

describe.skip('@codelab/schematics:use-case', () => {
  let appTree: Tree
  let tree: UnitTestTree

  const options: UseCaseSchematicSchema = {
    moduleName: 'userss',
    resolverType: 'Mutation',
    useCaseName: 'createUser',
  }

  const testRunner = new SchematicTestRunner(
    '@codelab/schematics',
    join(__dirname, '../../../../collection.json'),
  )

  const { moduleName, projectRoot } = normalizeOptions(options as any)

  beforeAll(async () => {
    appTree = createEmptyWorkspace(Tree.empty())
    tree = await testRunner
      .runSchematicAsync<DomainModuleSchematicSchema>(
        'domain-module',
        { name: 'userss' },
        appTree,
      )
      .toPromise()

    tree = await testRunner
      .runSchematicAsync<UseCaseSchematicSchema>('use-case', options, tree)
      .toPromise()
    console.log(tree.files)
    // Calls from dist
    // appTree = await callRule(
    //   externalSchematic('@codelab/schematics', 'use-case', options),
    //   appTree,
    // )
  })

  describe('Adds files to existing folders', () => {
    const expectedFiles = [
      'core/application/commands/CreateUserCommand.ts',
      'core/application/handlers/CreateUserCommandHandler.ts',

      // Use cases
      'core/application/useCases/createUser/CreateUserService.ts',
      'core/application/useCases/createUser/CreateUserErrors.ts',
      'core/application/useCases/createUser/CreateUserRequest.ts',
      'core/application/useCases/createUser/CreateUserResponse.ts',
      'core/application/useCases/createUser/CreateUserUseCase.i.spec.ts',
      'core/application/useCases/createUser/CreateUserUseCase.ts',
    ].map((file) => `${projectRoot}/src/${file}`)

    test.each(expectedFiles)('%p should exist', (file) => {
      expect(tree.exists(file)).toBeTruthy()
    })
  })
})
