import { IPropData } from '@codelab/frontend/abstract/core'
import { isServer } from '@codelab/shared/config'
import isArray from 'lodash/isArray'
import isObjectLike from 'lodash/isObjectLike'
import map from 'lodash/map'
import toPairsIn from 'lodash/toPairsIn'
import { modelTypeKey } from 'mobx-keystone'
import { Key } from 'react'
import { IKeyMapper, IOutput, IValueMapper } from './abstract'

const isReactNode = (obj: IPropData) => Boolean(obj['$$typeof'])
const isMobxModel = (obj: IPropData) => Boolean(obj[modelTypeKey])

const isHtmlNode = (obj: unknown) =>
  isServer ? false : obj instanceof HTMLElement

const isCyclic = (obj: IPropData) =>
  (isObjectLike(obj) && isReactNode(obj)) || isMobxModel(obj) || isHtmlNode(obj)

export const mapDeep = (
  obj: IPropData,
  valueMapper: IValueMapper,
  keyMapper: IKeyMapper = (v, k) => k,
  key: Key = '',
): IOutput => {
  obj = valueMapper(obj, key) as IOutput

  return isCyclic(obj)
    ? obj
    : isArray(obj)
    ? map(obj, (innerObj, index) =>
        mapDeep(innerObj, valueMapper, keyMapper, index),
      )
    : isObjectLike(obj)
    ? toPairsIn(obj)
        .map(([k, v]) => {
          const mappedKey = keyMapper(v, k)

          const mappedValue = isObjectLike(v)
            ? mapDeep(v, valueMapper, keyMapper, mappedKey)
            : valueMapper(v, k)

          return {
            [mappedKey]: mappedValue,
          }
        })
        .reduce((acc, c) => ({ ...acc, ...c }), {})
    : (valueMapper(obj, '') as IPropData)
}
