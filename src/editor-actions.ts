import { decrement, increment } from './actions/increment'
import Editors from './editors'

const actions = [
  {
    id: 'switch-markdup-editor',
    label: 'Switch to markup editor',
    // tslint:disable-next-line:no-bitwise
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_1],
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: () => Editors.selectEditor('markup')
  },
  {
    id: 'switch-style-editor',
    label: 'Switch to style editor',
    // tslint:disable-next-line:no-bitwise
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_2],
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: () => Editors.selectEditor('style')
  },
  {
    id: 'switch-states-editor',
    label: 'Switch to states editor',
    // tslint:disable-next-line:no-bitwise
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_3],
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,
    run: () => Editors.selectEditor('data')
  },
  increment,
  decrement
]

export default actions
