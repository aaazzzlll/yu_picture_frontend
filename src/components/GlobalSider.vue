<template>
  <div id="globalSider">
    <a-layout-sider
      v-if="loginUserStore.loginUser.id"
      breakpoint="lg"
      collapsedWidth="0"
      width="200"
    >
      <a-menu v-model:selectedKeys="current" mode="inline" :items="menuItems" @click="doMenuClick">
      </a-menu>
    </a-layout-sider>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { PictureOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '../stores/useLoginUserStore'
import { message } from 'ant-design-vue'

const loginUserStore = useLoginUserStore()
const menuItems = [
  {
    key: '/',
    icon: () => h(PictureOutlined),
    label: '公共图库',
    title: '公共图库',
  },
  {
    key: '/my_space',
    icon: () => h(UserOutlined),
    label: '我的空间',
    title: '我的空间',
  },
]

const router = useRouter()
//路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({ path: key })
}

//当前需要高亮的菜单项
const current = ref<string[]>([])
//监听路由变化，更新高亮菜单项
router.afterEach((to) => {
  current.value = [to.path]
})
</script>

<style scoped></style>
