import { notification } from 'antd'

const errorHandler = (err: Error) => {
  console.error(err)
  notification.error({
    message: 'Error',
    description: err.message
  })
}

export default errorHandler
