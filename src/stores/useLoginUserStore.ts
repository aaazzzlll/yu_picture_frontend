import { ref } from 'vue'
import { defineStore } from 'pinia'

/*
存储登录用户信息的状态
*/
//一个状态就存储一类要共享的数据
export const useLoginUserStore = defineStore('loginUser', () => {
  const loginUser = ref<any>({
    userName: '未登录',
  })

  async function fetchLoginUser() {
    //调用后端接口获取登录用户信息
    // const res=await getCurrentUser()
    // if(res.data.code===0&&res.data.data){
    //   loginUser.value=res.data.data
    // }
    setTimeout(() => {
      loginUser.value = {
        id: 1,
        userName: '测试用户',
      }
    }, 1000)
  }

  //设置登录用户
  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser
  }

  return { loginUser, fetchLoginUser, setLoginUser }
})
