import EventEmitter = require('events')

const parsePixels = (value: string | null) => parseFloat(value || '0')

class Inspector extends EventEmitter {
  private target: HTMLElement | null
  private marginOverlay: HTMLElement
  private paddingOverlay: HTMLElement
  private inspecting: boolean

  constructor() {
    super()
    this.inspecting = false

    window.addEventListener('scroll', () => this.recalculate(), true)
    window.addEventListener('resize', () => this.recalculate(), true)

    const marginOverlay = (this.marginOverlay = document.createElement('div'))
    marginOverlay.style.backgroundColor = '#C4DFB8'
    marginOverlay.style.opacity = '0.8'
    marginOverlay.style.pointerEvents = 'none'
    marginOverlay.style.position = 'absolute'
    marginOverlay.style.zIndex = '2147483647'

    const paddingOverlay = (this.paddingOverlay = document.createElement('div'))
    paddingOverlay.style.width = '10px'
    paddingOverlay.style.height = '10px'
    paddingOverlay.style.backgroundColor = '#A0C6E8'

    marginOverlay.appendChild(paddingOverlay)
    document.body.appendChild(marginOverlay)

    document.addEventListener('click', e => {
      if (this.target !== e.target) return
      this.emit('inspect', { target: this.target })
    })

    document.addEventListener('mousemove', e => {
      if (!this.inspecting) return
      const element = e.target as HTMLElement
      if (!element.matches('.preview-content *')) {
        return
      }
      this.target = element
      this.recalculate()
    })
  }

  public recalculate() {
    if (!this.target) return

    const { marginOverlay, paddingOverlay } = this
    const rect = this.target.getBoundingClientRect()
    const computed = window.getComputedStyle(this.target)

    const paddingLeft = parsePixels(computed.paddingLeft)
    const paddingRight = parsePixels(computed.paddingRight)
    const paddingTop = parsePixels(computed.paddingTop)
    const paddingBottom = parsePixels(computed.paddingBottom)

    const marginLeft = parsePixels(computed.marginLeft)
    const marginRight = parsePixels(computed.marginRight)
    const marginTop = parsePixels(computed.marginTop)
    const marginBottom = parsePixels(computed.marginBottom)

    marginOverlay.style.top = rect.top - marginTop + 'px'
    marginOverlay.style.left = rect.left - marginLeft + 'px'
    marginOverlay.style.width = rect.width + marginLeft + marginRight + 'px'
    marginOverlay.style.height = rect.height + marginTop + marginBottom + 'px'
    marginOverlay.style.borderLeft = `${marginLeft}px solid #F9CC9D`
    marginOverlay.style.borderRight = `${marginRight}px solid #F9CC9D`
    marginOverlay.style.borderTop = `${marginTop}px solid #F9CC9D`
    marginOverlay.style.borderBottom = `${marginBottom}px solid #F9CC9D`

    paddingOverlay.style.marginLeft = `${paddingLeft}px`
    paddingOverlay.style.marginTop = `${paddingTop}px`
    paddingOverlay.style.width = rect.width - paddingLeft - paddingRight + 'px'
    paddingOverlay.style.height =
      rect.height - paddingTop - paddingBottom + 'px'
  }

  public startInspecting() {
    this.inspecting = true
    this.marginOverlay.style.display = 'block'
    this.emit('startInspecting')
  }

  public stopInspecting() {
    this.inspecting = false
    this.target = null
    this.marginOverlay.style.display = 'none'
    this.marginOverlay.style.width = '0px'
    this.marginOverlay.style.height = '0px'
    this.paddingOverlay.style.width = '0px'
    this.paddingOverlay.style.height = '0px'
    this.emit('stopInspecting')
  }
}

export default new Inspector()
