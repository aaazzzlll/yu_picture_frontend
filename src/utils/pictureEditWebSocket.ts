export default class PictureEditWebSocket {
  private pictureId: number
  private socket: WebSocket | null
  private eventHandlers: any

  constructor(pictureId: number) {
    this.pictureId = pictureId // 当前编辑的图片 ID
    this.socket = null // WebSocket 实例
    this.eventHandlers = {} // 自定义事件处理器
  }

  /**
   * 初始化 WebSocket 连接
   */
  connect() {
    const DEV_BASE_URL = 'ws://localhost:8123'
    // 线上地址
    // const PROD_BASE_URL = "ws://81.69.229.63";
    const url = `${DEV_BASE_URL}/api/ws/picture/edit?pictureId=${this.pictureId}`
    // 创建 WebSocket 连接
    this.socket = new WebSocket(url)

    // 设置数据传输格式，如果服务器发过来的是二进制数据，把他封装成Blob对象
    this.socket.binaryType = 'blob'

    // 监听连接成功事件
    this.socket.onopen = () => {
      console.log('WebSocket 连接已建立')
      this.triggerEvent('open') //触发自定义的‘open’事件
    }

    // 监听消息事件
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      console.log('收到消息:', message)

      // 根据消息类型触发对应事件
      const type = message.type
      this.triggerEvent(type, message)
    }

    // 监听连接关闭事件
    this.socket.onclose = (event) => {
      console.log('WebSocket 连接已关闭:', event)
      this.triggerEvent('close', event)
    }

    // 监听错误事件
    this.socket.onerror = (error) => {
      console.error('WebSocket 发生错误:', error)
      this.triggerEvent('error', error)
    }
  }

  /**
   * 关闭 WebSocket 连接，否则会一直保持连接状态，占用资源
   */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      console.log('WebSocket 连接已手动关闭')
    }
  }

  /**
   * 发送消息到后端
   * @param {Object} message 消息对象
   */
  sendMessage(message: object) {
    // 必须确保 socket 存在，且状态是 OPEN (连接中)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
      console.log('消息已发送:', message)
    } else {
      console.error('WebSocket 未连接，无法发送消息:', message)
    }
  }

  /**
   * 添加自定义事件监听
   * @param {string} type 消息类型
   * @param {Function} handler 消息处理函数
   */
  //订阅事件
  on(type: string, handler: (data?: any) => void) {
    if (!this.eventHandlers[type]) {
      //如果还没人订阅过，先建个空数组
      this.eventHandlers[type] = []
    }
    // 把处理函数存进数组里
    this.eventHandlers[type].push(handler)
  }

  /**
   * 触发事件
   * @param {string} type 消息类型
   * @param {Object} data 消息数据
   */
  triggerEvent(type: string, data?: any) {
    // 找出所有订阅了这个 type 的函数
    const handlers = this.eventHandlers[type]
    if (handlers) {
      //遍历数组，依次执行
      handlers.forEach((handler: any) => handler(data))
    }
  }
}
