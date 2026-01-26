import { message } from 'ant-design-vue'
import axios from 'axios'

//创建Axios实例
const myAxios = axios.create({
  baseURL: 'http://localhost:8123',
  timeout: 60000,
  //是否携带cookie(登录凭证)
  withCredentials: true,
})

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    const { data } = response
    //未登录
    if (data.code === 40100) {
      //如果(这不是一个登录请求并且当前不在登录页面)，跳转到登录页面
      if (
        !response.request.responseURL.includes('user/get/login') &&
        !window.location.pathname.includes('user/login')
      ) {
        message.warning('请先登录')
        //回到登录页，并且记录当前位置
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    return response
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    return Promise.reject(error)
  },
)

//导出axios实例供外部使用
export default myAxios
