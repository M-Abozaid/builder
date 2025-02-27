import { IElementType } from '@codelab/frontend/abstract/core'
import { getSelectElementComponent } from '../fields'
import { UiPropertiesFn } from '../types'

export const elementTypeUiProperties: UiPropertiesFn<IElementType> = (type) => {
  return {
    uniforms: {
      component: getSelectElementComponent((type as IElementType).elementKind),
    },
  }
}
