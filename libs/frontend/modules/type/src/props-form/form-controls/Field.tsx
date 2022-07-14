import {
  IAnyAction,
  IField,
  IPrimitiveTypeKind,
  IPropsFieldContext,
  ITypeKind,
} from '@codelab/shared/abstract/core'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ArrayField } from './ArrayField'
import { CheckboxField } from './CheckboxField'
import { CodeMirrorField } from './CodeMirror'
import { SelectActionField } from './SelectActionField'
import { SelectComponentField } from './SelectComponentField'

export type FieldProps = {
  field: IField
  form: UseFormReturn
  context?: IPropsFieldContext

  actionsList?: Array<IAnyAction>
}

export const Field = observer(
  ({ field, form, context, actionsList }: FieldProps) => {
    switch (field.type.current.kind) {
      case ITypeKind.ArrayType:
        return (
          <ArrayField
            field={field}
            form={form}
            renderItemField={(itemField) => (
              <Field context={context} field={itemField} form={form} />
            )}
          />
        )
      case ITypeKind.ReactNodeType:
      case ITypeKind.RenderPropsType:
        return (
          <SelectComponentField context={context} field={field} form={form} />
        )

      case ITypeKind.ActionType:
        return <SelectActionField context={context} field={field} form={form} />

      case ITypeKind.InterfaceType:
        return (
          <>
            {[...field.type.current.fields.values()].map((f, i) => (
              <Field context={context} field={f} form={form} />
            ))}
          </>
        )

      case ITypeKind.PrimitiveType: {
        return field.type.current.primitiveKind ===
          IPrimitiveTypeKind.Boolean ? (
          <CheckboxField field={field} form={form} />
        ) : (
          <CodeMirrorField context={context} field={field} form={form} />
        )
      }

      default:
        return <CodeMirrorField context={context} field={field} form={form} />
    }
  },
)
