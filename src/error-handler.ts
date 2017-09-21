import { Intent, Position, Toaster } from '@blueprintjs/core'

const errorHandler = (err: Error) => {
  console.error(err)
  Toaster.create({
    position: Position.TOP
  }).show({
    message: err.message,
    intent: Intent.DANGER
  })
}

export default errorHandler
