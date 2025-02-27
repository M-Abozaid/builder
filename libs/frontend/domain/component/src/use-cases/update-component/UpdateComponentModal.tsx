import {
  IComponentService,
  IUpdateComponentDTO,
} from '@codelab/frontend/abstract/core'
import { createNotificationHandler } from '@codelab/frontend/shared/utils'
import { ModalForm } from '@codelab/frontend/view/components'
import { observer } from 'mobx-react-lite'
import React from 'react'
import tw from 'twin.macro'
import { AutoFields } from 'uniforms-antd'
import { updateComponentSchema } from './updateComponentSchema'

export const UpdateComponentModal = observer<{
  componentService: IComponentService
}>(({ componentService }) => {
  const updatedComponent = componentService.updateModal.component

  if (!updatedComponent) {
    return null
  }

  const handleSubmit = (input: IUpdateComponentDTO) => {
    return componentService.update(updatedComponent, input)
  }

  const model = { name: updatedComponent.name }
  const closeModal = () => componentService.updateModal.close()

  return (
    <ModalForm.Modal
      okText="Update Component"
      onCancel={closeModal}
      title={<span css={tw`font-semibold`}>Update component</span>}
      visible={componentService.updateModal.isOpen}
    >
      <ModalForm.Form<IUpdateComponentDTO>
        model={model}
        onSubmit={handleSubmit}
        onSubmitError={createNotificationHandler({
          title: 'Error while creating component',
          type: 'error',
        })}
        onSubmitSuccess={closeModal}
        schema={updateComponentSchema}
      >
        <AutoFields />
      </ModalForm.Form>
    </ModalForm.Modal>
  )
})
