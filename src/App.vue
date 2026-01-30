<template>
  <a-config-provider :locale="appLocale">
    <div id="app">
      <BasicLayout />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
// import { healthUsingGet } from './api/mainController'
import BasicLayout from './layouts/BasicLayout.vue'
//import { useLoginUserStore } from './stores/useLoginUserStore'
import zhCN from 'ant-design-vue/es/locale/zh_CN' // 引入 ant-design-vue 的中文语言包
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn' // 引入 dayjs 的中文语言包

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn')
// 使用 Composition API 和 setup 函数定义响应式数据
const appLocale = zhCN // 设置当前应用的语言环境

//已经改为在权限校验文件中获取用户信息
// const loginUserStore = useLoginUserStore()
// loginUserStore.fetchLoginUser()

// healthUsingGet().then((res) => {
//   console.log(res)
// })
</script>

<style scoped></style>
