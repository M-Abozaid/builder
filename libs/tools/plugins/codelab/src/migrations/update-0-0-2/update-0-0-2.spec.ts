import * as path from 'path'
import { Tree } from '@angular-devkit/schematics'
import { SchematicTestRunner } from '@angular-devkit/schematics/testing'
import { readJsonInTree, serializeJson } from '@nrwl/workspace'
import { createEmptyWorkspace } from '@nrwl/workspace/testing'

describe.skip('update-0.0.2', () => {
  let initialTree: Tree
  let schematicRunner: SchematicTestRunner

  beforeEach(() => {
    initialTree = createEmptyWorkspace(Tree.empty())

    schematicRunner = new SchematicTestRunner(
      '@nrwl/nx-plugin',
      path.join(__dirname, '../../../migrations.json'),
    )

    initialTree.overwrite(
      'package.json',
      serializeJson({
        dependencies: {},
      }),
    )
  })

  it(`should update dependencies`, async () => {
    const result = await schematicRunner
      .runSchematicAsync('update-0.0.2', {}, initialTree)
      .toPromise()

    const { dependencies } = readJsonInTree(result, '/package.json')

    expect(dependencies).toEqual({})
  })
})
