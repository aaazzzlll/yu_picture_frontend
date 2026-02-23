<template>
  <div id="mySpacePage">
    <p>正在跳转中...</p>
  </div>
</template>

<script setup lang="ts">
import { listSpaceVoByPageUsingPost } from '@/api/spaceController'
import { SPACE_TYPE_ENUM } from '@/constants/space'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { message } from 'ant-design-vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

/*此处必须对用户状态进行检查，如果未登录用户直接输入url是可以直接访问该页面的,
 *因此即使未登录用户看不到“我的空间”菜单项，也必须对用户状态进行检查
 */
const loginUserStore = useLoginUserStore()
const router = useRouter()

//检查用户是否有个人空间
const checkUserSpace = async () => {
  const loginUser = loginUserStore.loginUser
  if (!loginUser?.id) {
    //未登录，跳转到登录页
    router.replace('/user/login')
    return
  }
  const res = await listSpaceVoByPageUsingPost({
    userId: loginUser.id,
    current: 1,
    pageSize: 1,
    spaceType: SPACE_TYPE_ENUM.PRIVATE,
  })
  if (res.data.code === 0) {
    if (res.data.data?.records?.length > 0) {
      const space = res.data.data?.records[0]
      router.replace(`/space/${space?.id}`)
    } else {
      router.replace('/add_space')
      message.warn('请先创建个人空间')
    }
  } else {
    message.error('加载个人空间失败 ' + res.data.message)
  }
}

onMounted(() => {
  checkUserSpace()
})
</script>
