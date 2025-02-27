import { TagOptions, TagWhere } from '@codelab/shared/abstract/codegen'
import { Maybe, Nullish } from '@codelab/shared/abstract/types'
import type { LabeledValue } from 'antd/es/select'
import { ObjectMap, Ref } from 'mobx-keystone'
import {
  ICacheService,
  ICRUDModalService,
  ICRUDService,
  IEntityModalService,
  IQueryService,
} from '../../service'
import { ICreateTagDTO, ITagDTO, IUpdateTagDTO } from './tag.dto.interface'
import { ITag } from './tag.model.interface'
import { ITagTreeService } from './tag-tree.service.interface'

export interface ITagService
  extends ICRUDService<ITag, ICreateTagDTO, IUpdateTagDTO>,
    Omit<IQueryService<ITag, TagWhere, TagOptions>, 'getOne'>,
    ICacheService<ITagDTO, ITag>,
    Omit<ICRUDModalService<Ref<ITag>, { tag: Maybe<ITag> }>, 'deleteModal'> {
  /**
   * Properties
   */
  deleteManyModal: IEntityModalService<Array<Ref<ITag>>, { tags: Array<ITag> }>
  // updateModal: IEntityModalService<Ref<ITag>, { tag?: ITag }>
  tags: ObjectMap<ITag>
  tagsList: Array<ITag>
  loadTagTree(): void
  tag(id: string): Maybe<ITag>
  tagsSelectOptions: Array<LabeledValue>
  selectedOption: LabeledValue
  deleteCheckedTags(): void
  setSelectedTag(tag: Nullish<Ref<ITag>>): void
  setCheckedTags(tags: Array<Ref<ITag>>): void
  checkedTags: Array<Ref<ITag>>
  treeService: ITagTreeService
}
