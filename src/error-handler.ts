import { Position, Toaster, Intent } from '@blueprintjs/core'

const errorHandler = (err: Error) => {
  Toaster.create({
    position: Position.TOP
  }).show({
    message: err.message,
    intent: Intent.DANGER
  })
}

export default errorHandler
