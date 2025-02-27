import type {
  IElement,
  IElementTree,
  IPropData,
  IRenderer,
  IRenderOutput,
  IRenderPipe,
  IStore,
  RendererProps,
} from '@codelab/frontend/abstract/core'
import { DATA_ELEMENT_ID } from '@codelab/frontend/abstract/core'
import { elementRef, elementTreeRef } from '@codelab/frontend/domain/element'
import { getActionService, storeRef } from '@codelab/frontend/domain/store'
import { getTypeService } from '@codelab/frontend/domain/type'
import { getElementService } from '@codelab/frontend/presenter/container'
import { ITypeKind } from '@codelab/shared/abstract/core'
import type { Nullable } from '@codelab/shared/abstract/types'
import { mapDeep, mergeProps } from '@codelab/shared/utils'
import flatMap from 'lodash/flatMap'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import { computed } from 'mobx'
import {
  detach,
  frozen,
  getSnapshot,
  idProp,
  Model,
  model,
  modelAction,
  prop,
  Ref,
  rootRef,
} from 'mobx-keystone'
import { createTransformer } from 'mobx-utils'
import React, { ComponentType, ReactElement, ReactNode } from 'react'
import { ArrayOrSingle } from 'ts-essentials'
import { ITypedValueTransformer } from './abstract/ITypedValueTransformer'
import { getAtom } from './atoms'
import { ElementWrapper, ElementWrapperProps } from './element/ElementWrapper'
import { ExtraElementProps } from './ExtraElementProps'
import {
  defaultPipes,
  renderPipeFactory,
} from './renderPipes/renderPipe.factory'
import { typedValueTransformersFactory } from './typedValueTransformers/typedValueTransformersFactory'
import { isTypedValue } from './utils/isTypedValue'
import { reduceComponentTree } from './utils/reduceComponentTree'
import { mapOutput } from './utils/renderOutputUtils'

/**
 * Handles the logic of rendering treeElements. Takes in an optional appTree
 *
 * NB! call .init() and wait for it to finish before using .render()
 *
 * Calling .render() renders a single Element (without it's children)
 * This ensures that each render() call can be used for a single isolated observer() - wrapped React Element
 * and it will get re-rendered only if the source Element model is changed
 *
 * The renderPipe and typedValueTransformers replace the previous render pipeline.
 * It's useful to keep them as mobx-keystone models because they can access the context of the state tree
 * which in practice can act as a DI container, so we can get outside data in the render pipeline easily.
 *
 * For example - we use the renderContext from ./renderContext inside the pipes to get the renderer model itself and its tree.
 */

const init = ({
  pageTree,
  appStore,
  appTree,
  isBuilder,
  set_selectedNode,
}: RendererProps) => {
  /**
   * Use a builder-specific render service that overwrites each onClick handler with a void click handler.
   */
  const builderGlobals = {
    onClick: (e: React.MouseEvent) => {
      if (!isBuilder) {
        return
      }

      e.stopPropagation()

      const elementId = e.currentTarget.getAttribute(DATA_ELEMENT_ID)

      if (elementId !== null) {
        set_selectedNode?.(elementRef(elementId))
      }
    },
    href: '#',
  }

  return new Renderer({
    appTree: appTree ? elementTreeRef(appTree) : null,
    pageTree: elementTreeRef(pageTree),
    appStore: storeRef(appStore),
    extraElementProps: new ExtraElementProps({
      // pass
      global: frozen(isBuilder ? builderGlobals : {}),
    }),
  })
}

@model('@codelab/Renderer')
export class Renderer
  extends Model(
    {
      id: idProp,

      /**
       * A tree of providers that will get rendered before all of the regular elements
       */
      appTree: prop<Nullable<Ref<IElementTree>>>(null),

      /**
       * Store attached to app, needed to access its actions
       */
      appStore: prop<Ref<IStore>>(),
      /**
       * The tree that's being rendered, we assume that this is properly constructed
       */
      pageTree: prop<Nullable<Ref<IElementTree>>>(null),

      /**
       * Props passed to specific elements, such as from global props context
       */
      extraElementProps: prop(() => new ExtraElementProps({})),

      /**
       * Those transform different kinds of typed values into render-ready props
       */
      typedValueTransformers: prop<Array<ITypedValueTransformer>>(() =>
        typedValueTransformersFactory(),
      ),

      /**
       * The render pipe handles and augments the render process. This is a linked list / chain of render pipes
       */
      renderPipe: prop<IRenderPipe>(() => renderPipeFactory(defaultPipes)),

      /**
       * Will log the render output and render pipe info to the console
       */
      debugMode: prop(false).withSetter(),
    },
    {
      toSnapshotProcessor(sn, modelInstance) {
        return {
          ...sn,
          // Remove those, because they are runtime only and not serializable
          extraElementProps: getSnapshot(new ExtraElementProps({})),
        }
      },
    },
  )
  implements IRenderer
{
  @modelAction
  initForce(
    pageElementTree: IElementTree,
    appElementTree: Nullable<IElementTree>,
  ) {
    this.pageTree = elementTreeRef(pageElementTree)
    this.appTree = appElementTree ? elementTreeRef(appElementTree) : null
  }

  renderRoot() {
    const root = this.pageTree?.current.root

    if (!root) {
      console.warn('Renderer: No root element found')

      return null
    }

    const rootElement = this.renderElement(root)

    return this.renderWithProviders(rootElement)
  }

  /**
   * Takes the provider tree and wrap it around our root element
   */
  private renderWithProviders(rootElement: ReactElement) {
    const providerRoot = this.appTree?.current.root

    const providerElements = providerRoot
      ? [providerRoot, ...providerRoot.leftHandDescendants]
      : []

    const providerOutputsMaybeArray = providerElements.map((element) =>
      this.renderIntermediateElement(element),
    )

    const providerOutputs = flatMap(providerOutputsMaybeArray, (o) =>
      mapOutput(o, (io) => io),
    ).filter((o): o is IRenderOutput => Boolean(o))

    const Providers = reduceComponentTree(
      providerOutputs
        .map((output) =>
          output.atomType ? [getAtom(output.atomType), output.props] : null,
        )
        .filter((x): x is [ComponentType, IPropData] => Boolean(x)),
    )

    return React.createElement(Providers, {}, rootElement)
  }

  runPreAction = (element: IElement) => {
    if (!element.preRenderActionId) {
      return
    }

    const actionService = getActionService(this)
    const action = actionService.action(element.preRenderActionId)

    if (!action) {
      console.warn(`Pre render action not found for element ${element.label}`)

      return () => undefined
    }

    return this.state.values[action.name].run()
  }

  getPostAction = (element: IElement) => {
    if (!element.postRenderActionId) {
      return null
    }

    const actionService = getActionService(this)
    const action = actionService.action(element.postRenderActionId)

    if (!action) {
      console.warn(`Post render action not found for element ${element.label}`)

      return () => undefined
    }

    return this.state.values[action.name].run
  }

  @computed
  get state() {
    return this.appStore.current.state
  }

  /**
   * Renders a single Element using the provided RenderAdapter
   */
  renderElement = (element: IElement, extraProps?: IPropData): ReactElement => {
    this.runPreAction(element)

    const wrapperProps: ElementWrapperProps & { key: string } = {
      key: `element-wrapper-${element.id}`,
      renderService: this,
      element,
      extraProps,
      postAction: this.getPostAction(element),
    }

    return React.createElement(ElementWrapper, wrapperProps)
  }

  /**
   * Renders a single element (without its children) to an intermediate RenderOutput
   *
   * @param extraProps props passed down from parent components, these have high priority than element.props
   */
  renderIntermediateElement = (
    element: IElement,
    extraProps?: IPropData,
  ): ArrayOrSingle<IRenderOutput> => {
    let props = mergeProps(
      element.__metadataProps,
      element.props?.values,
      extraProps,
      this.extraElementProps.getForElement(element.id),
    )

    props = this.processPropsForRender(props, element)

    /**
     * Pass down global props
     */
    const { globalProps } = element.applyPropMapBindings(props)

    const appendGlobalProps = (renderOutput: IRenderOutput) => {
      const mergedGlobalProps = mergeProps(
        renderOutput.globalProps,
        globalProps,
      )

      return isEmpty(mergedGlobalProps)
        ? renderOutput
        : {
            ...renderOutput,
            globalProps: mergedGlobalProps,
          }
    }

    const output = this.renderPipe.render(element, props)

    return mapOutput(output, appendGlobalProps)
  }

  /**
   * Renders the elements children, createTransformer memoizes the function
   */
  renderChildren = createTransformer(
    (parentOutput: IRenderOutput): ArrayOrSingle<ReactNode> => {
      // const element = this.pageTree?.current.element(parentOutput.elementId)
      const elementService = getElementService(this)
      const element = elementService.elements.get(parentOutput.elementId)

      if (!element) {
        console.warn(
          `RenderService: Element ${parentOutput.elementId} not found in tree`,
        )

        return undefined
      }

      const children = element.children.map((child) =>
        this.renderElement(child),
      )

      const hasChildren = Array.isArray(children)
        ? children.length > 0
        : Boolean(children)

      if (!hasChildren) {
        /*
         * It's important to be undefined if we have no children to display,
         * since void components like input will throw an error if their children prop isn't undefined
         */
        return undefined
      }

      /*
       * If we have only one child, just return it.
       * Ant Design doesn't handle array children well in some cases, like Forms
       */
      if (Array.isArray(children) && children.length === 1) {
        return children[0]
      }

      return children
    },
  )

  logRendered = (element: IElement, rendered: ArrayOrSingle<IRenderOutput>) => {
    if (this.debugMode) {
      console.dir({ element: element, rendered })
    }
  }

  /**
   * Parses and transforms the props for a given element, so they are ready for rendering
   */
  private processPropsForRender = (props: IPropData, element: IElement) => {
    props = this.applyPropTypeTransformers(props)
    props = element.executePropTransformJs(props)
    props = this.replaceStateInProps(props)

    const { localProps } = element.applyPropMapBindings(props)
    props = mergeProps(props, localProps)

    return props
  }

  private replaceStateInProps = (props: IPropData) => {
    props = mapDeep(
      props,
      // value mapper
      (v, k) => (isString(v) ? this.appStore.current.getByExpression(v) : v),
      // key mapper
      (v, k) =>
        (isString(k) ? this.appStore.current.getByExpression(k) : k) as string,
    )

    return props
  }

  /**
   * Applies all the type transformers to the props
   */
  private applyPropTypeTransformers = (props: IPropData) =>
    mapDeep(props, (value) => {
      if (!isTypedValue(value)) {
        return value
      }

      const typeKind = this.getTypeKindById(value.type)

      if (!typeKind) {
        return value
      }

      for (const propTransformer of this.typedValueTransformers) {
        if (
          !propTransformer.canHandleTypeKind(typeKind) ||
          !propTransformer.canHandleValue(value)
        ) {
          continue
        }

        return propTransformer.transform(value, typeKind)
      }

      /*
       * We need to return an empty string here, if the prop cannot be transformed, otherwise
       * the empty object will be passed as React Child, which will throw an error
       */
      if (typeKind === ITypeKind.ReactNodeType) {
        return ''
      }

      return {}
    })

  private getTypeKindById(typeId: string): ITypeKind | undefined {
    return getTypeService(this).type(typeId)?.kind
  }

  static init = init
}

export const renderServiceRef = rootRef<IRenderer>(
  '@codelab/RenderServiceRef',
  {
    onResolvedValueChange(ref, newType, oldType) {
      if (oldType && !newType) {
        detach(ref)
      }
    },
  },
)
