import { configure } from 'mobx'
import { createContext } from 'react'

import Ui from './ui'
import Workspace from './workspace'

configure({
  enforceActions: 'never',
  computedRequiresReaction: false, //true,
})

export interface Store {
  ui: Ui
  workspace: Workspace
}

let store: Store

export default function createStore(): Store {
  if (!store) store = { ui: new Ui(), workspace: new Workspace() }
  return store
}

export const StoreContext = createContext<Store>(createStore())

export { default as Ui } from './ui'
export { default as Project } from './project'
export { default as Workspace } from './workspace'

export * from './base'
