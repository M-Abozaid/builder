import { IPropData, ITypeService } from '@codelab/frontend/abstract/core'
import { Form } from '@codelab/frontend/view/components'
import { ITypeKind } from '@codelab/shared/abstract/core'
import { JSONSchemaType } from 'ajv'
import React, { useMemo } from 'react'
import { useField } from 'uniforms'
import { AutoFields } from 'uniforms-antd'
import { schemaTransformer } from '../../../store'

export interface SelectDefaultValueProps {
  typeService: ITypeService
}

export const SelectDefaultValue = ({
  typeService,
}: SelectDefaultValueProps) => {
  const [fieldType, context] = useField('fieldType', {})

  const type = fieldType.value
    ? typeService.type(fieldType.value as string)
    : null

  const schema = useMemo(
    () => ({
      type: 'object',
      label: '',
      properties: type
        ? { defaultValues: schemaTransformer.transform(type) }
        : {},
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type?.id],
  )

  const defaultValues =
    !context.model.defaultValues && type?.kind === ITypeKind.ArrayType
      ? []
      : context.model.defaultValues

  return (
    <Form
      model={{ defaultValues }}
      onChange={(key, value) => {
        context.onChange(key, value)
      }}
      onSubmit={() => Promise.resolve()}
      schema={schema as JSONSchemaType<IPropData>}
    >
      <AutoFields />
    </Form>
  )
}
