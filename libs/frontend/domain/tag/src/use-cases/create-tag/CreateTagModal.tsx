import {
  ICreateTagDTO,
  ITagService,
  IUserService,
} from '@codelab/frontend/abstract/core'
import { createNotificationHandler } from '@codelab/frontend/shared/utils'
import { ModalForm } from '@codelab/frontend/view/components'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { AutoFields, SelectField } from 'uniforms-antd'
import { createTagSchema } from './createTagSchema'

export const CreateTagModal = observer<{
  tagService: ITagService
  userService: IUserService
}>(({ tagService, userService }) => {
  const onSubmit = (input: ICreateTagDTO) => {
    return tagService.create([input])
  }

  const options = tagService.tagsSelectOptions
  const defaultOption = tagService.selectedOption
  const closeModal = () => tagService.createModal.close()

  return (
    <ModalForm.Modal
      okText="Create Tag"
      onCancel={closeModal}
      visible={tagService.createModal.isOpen}
    >
      <ModalForm.Form
        model={{
          parentTagId: `${defaultOption.value}`,
          auth0Id: userService.user?.auth0Id,
        }}
        onSubmit={onSubmit}
        onSubmitError={createNotificationHandler({
          title: 'Error while creating tag',
        })}
        onSubmitSuccess={closeModal}
        schema={createTagSchema}
      >
        <AutoFields omitFields={['parentTagId']} />
        {/* <DisplayIfNotRoot> */}
        <SelectField
          label="Parent Tag"
          name="parentTagId"
          optionFilterProp="label"
          options={options}
          showSearch
        />
        {/* </DisplayIfNotRoot> */}
      </ModalForm.Form>
    </ModalForm.Modal>
  )
})
