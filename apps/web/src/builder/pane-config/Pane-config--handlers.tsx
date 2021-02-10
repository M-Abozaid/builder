import { PaneConfigState } from './Pane-config'
import { UseOverlayToolbarFunctions } from '@codelab/frontend'
import {
  AddChildVertexInput,
  useUpdateVertexMutation,
} from '@codelab/generated'

export interface PaneConfigHandlersProps {
  setPaneConfig: (props: PaneConfigState) => void
  updateVertexMutation: ReturnType<typeof useUpdateVertexMutation>
  showHoverOverlay: UseOverlayToolbarFunctions['show']
  showClickOverlay: UseOverlayToolbarFunctions['show']
  resetHoverOverlay: UseOverlayToolbarFunctions['reset']
  resetClickOverlay: UseOverlayToolbarFunctions['reset']
  addChildVertex: (input: AddChildVertexInput) => any
}
