const EventEmitter = require('events')

class EventBus extends EventEmitter {}

module.exports = new EventBus()
