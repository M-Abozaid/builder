/**
 * Need `name` for `parent` & `children` as lookup key, since id can change during import/export
 */
export const tagSelectionSet = `{
  id
  name
  parent {
    id
    name
  }
  children {
    id
    name
  }
}`
