import type {
  ICreateFieldDTO,
  IField,
  IFieldDTO,
  IInterfaceType,
} from '@codelab/frontend/abstract/core'
import { IFieldService } from '@codelab/frontend/abstract/core'
import { getElementService } from '@codelab/frontend/presenter/container'
import {
  FieldCreateInput,
  FieldUpdateInput,
} from '@codelab/shared/abstract/codegen'
import { connectNode, reconnectNode } from '@codelab/shared/data'
import { computed } from 'mobx'
import {
  _async,
  _await,
  idProp,
  Model,
  model,
  modelAction,
  modelFlow,
  objectMap,
  prop,
  transaction,
} from 'mobx-keystone'
import { fieldApi } from './apis/field.api'
import {
  CreateFieldModalService,
  FieldModalService,
} from './field-modal.service'
import { Field } from './models'
import { getTypeService } from './type.service.context'

@model('@codelab/FieldService')
export class FieldService
  extends Model({
    id: idProp,
    fields: prop(() => objectMap<IField>()),
    createModal: prop(() => new CreateFieldModalService({})),
    updateModal: prop(() => new FieldModalService({})),
    deleteModal: prop(() => new FieldModalService({})),
  })
  implements IFieldService
{
  @computed
  get elementService() {
    return getElementService(this)
  }

  @computed
  get typeService() {
    return getTypeService(this)
  }

  // The field actions are here because if I put them in InterfaceType
  // some kind of circular dependency happens that breaks the actions in weird and unpredictable ways
  @modelFlow
  @transaction
  create = _async(function* (this: FieldService, data: Array<ICreateFieldDTO>) {
    const input: Array<FieldCreateInput> = data.map((field) => ({
      description: field.description,
      id: field.id,
      key: field.key,
      name: field.name,
      defaultValues: JSON.stringify(field.defaultValues),
      validationRules: JSON.stringify(field.validationRules),
      fieldType: connectNode(field.fieldType),
      api: connectNode(field.interfaceTypeId),
    }))

    const {
      createFields: { fields },
    } = yield* _await(fieldApi.CreateFields({ input }))

    for (const { interfaceTypeId } of data) {
      const interfaceType = this.typeService.type(
        interfaceTypeId,
      ) as IInterfaceType

      interfaceType.writeFieldCache(fields)
    }

    return fields.map((field) => this.writeCache(field))
  })

  @modelFlow
  @transaction
  update = _async(function* (
    this: FieldService,
    existing: IField,
    data: ICreateFieldDTO,
  ) {
    const input: FieldUpdateInput = {
      fieldType: reconnectNode(data.fieldType),
      description: data.description,
      id: data.id,
      key: data.key,
      name: data.name,
      defaultValues: JSON.stringify(data.defaultValues),
      validationRules: JSON.stringify(data.validationRules),
    }

    const {
      updateFields: { fields },
    } = yield* _await(
      fieldApi.UpdateFields({
        where: {
          id: existing.id,
        },
        update: input,
      }),
    )

    return fields.map((field) => this.writeCache(field))
  })

  @modelFlow
  @transaction
  delete = _async(function* (this: FieldService, ids: Array<string>) {
    // const input = { where: { id: fieldId }, interfaceId }
    ids.forEach((id) => this.fields.delete(id))

    const {
      deleteFields: { nodesDeleted },
    } = yield* _await(
      fieldApi.DeleteFields({
        where: {
          id_IN: ids,
        },
      }),
    )

    return nodesDeleted

    //     interfaceType,
    // yield* _await(this.updateDefaults(interfaceId, null, field.key))

    // Returns current edges, not deleted edges
    // const deletedField =
    //   res.updateInterfaceTypes.interfaceTypes[0].fieldsConnection.edges[0]
    //
    // if (!deletedField) {
    //   throw new Error(`Failed to delete field with id ${fieldId}`)
    // }

    // interfaceType.deleteFieldLocal(field)
  })

  @modelAction
  writeCache(fragment: IFieldDTO) {
    let fieldModel = this.fields.get(fragment.id)

    if (fieldModel) {
      fieldModel.writeCache(fragment)
    } else {
      fieldModel = Field.hydrate(fragment)
      this.fields.set(fragment.id, fieldModel)
    }

    return fieldModel
  }
}
