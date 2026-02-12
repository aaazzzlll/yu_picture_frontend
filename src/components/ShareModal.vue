<template>
  <div>
    <a-modal v-model:open="open" title="分享图片" :footer="null" @cancel="closeModal">
      <h4>复制分享链接</h4>
      <a-typography-link copyable>
        {{ link }}
      </a-typography-link>
      <div style="margin-bottom: 16px"></div>
      <h4>手机扫码查看</h4>
      <a-qrcode :value="link"></a-qrcode>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

interface Props {
  title: string
  link: string
}
const props = withDefaults(defineProps<Props>(), {
  title: '分享图片',
  link: 'https://yupicture.cin.com.cn',
})

const open = ref<boolean>(false)

const openModal = () => {
  open.value = true
}

const closeModal = () => {
  open.value = false
}

//暴露函数给父组件
defineExpose({
  openModal,
})
</script>
