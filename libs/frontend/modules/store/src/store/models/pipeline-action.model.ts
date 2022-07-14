import {
  ActionWithOrder,
  assertIsActionKind,
  IActionKind,
  IPipelineAction,
  IPipelineActionDTO,
} from '@codelab/shared/abstract/core'
import { flatten } from 'lodash'
import { computed } from 'mobx'
import { ExtendedModel, model, prop } from 'mobx-keystone'
import { actionRef } from './action.ref'
import { createActionBase } from './action-base.model'

const hydrate = (action: IPipelineActionDTO): IPipelineAction => {
  assertIsActionKind(action.type, IActionKind.PipelineAction)

  return new PipelineAction({
    id: action.id,
    name: action.name,
    runOnInit: action.runOnInit,
    storeId: action.store.id,
    type: action.type,
    actions: action.actionsConnection.edges.flatMap(
      (x) =>
        x.orders?.map((y) => ({
          order: +y || 0,
          action: actionRef(x.node.id),
        })) || [],
    ),
  })
}

@model('@codelab/PipelineAction')
export class PipelineAction
  extends ExtendedModel(createActionBase(IActionKind.PipelineAction), {
    actions: prop<Array<ActionWithOrder>>(),
  })
  implements IPipelineAction
{
  @computed
  get actionsSorted() {
    return [...this.actions.values()]
      .sort(compareOrder)
      .map((a) => a.action.current)
  }

  static hydrate = hydrate

  getQueue() {
    return Promise.resolve(
      Promise.all(this.actionsSorted.map((a) => a.getQueue())).then((a) =>
        flatten(a),
      ),
    )
  }
}

export const compareOrder = (a: ActionWithOrder, b: ActionWithOrder) =>
  (a.order ?? 0) - (b.order ?? 0)
