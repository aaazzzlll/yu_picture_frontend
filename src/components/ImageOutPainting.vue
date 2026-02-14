<template>
  <a-modal
    class="image-out-painting"
    v-model:open="open"
    title="AI 扩图"
    :footer="null"
    @cancel="closeModal"
  >
    <a-row gutter="16">
      <a-col span="12">
        <h4>原始图片</h4>
        <img :src="picture?.url" :alt="picture?.name" style="max-width: 100%" />
      </a-col>
      <a-col span="12">
        <h4>扩图结果</h4>
        <img
          v-if="resultImageUrl"
          :src="resultImageUrl"
          :alt="picture?.name"
          style="max-width: 100%"
        />
      </a-col>
    </a-row>
    <div style="margin-bottom: 16px"></div>
    <a-flex justify="center" gap="16">
      <a-button type="primary" ghost :loading="!!taskId" @click="createTask">生成图片</a-button>
      <a-button v-if="resultImageUrl" type="primary" :loading="uploadLoading" @click="handleUpload"
        >应用结果</a-button
      >
    </a-flex>
  </a-modal>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  createPictureOutPaintingTaskUsingPost,
  getPictureOutPaintingTaskUsingGet,
  uploadPictureByUrlUsingPost,
} from '@/api/pictureController'

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}
const props = defineProps<Props>()

const resultImageUrl = ref<string>()

//任务id
const taskId = ref<string>('')

//创建任务
const createTask = async () => {
  if (!props.picture?.id) {
    return
  }
  const res = await createPictureOutPaintingTaskUsingPost({
    pictureId: props.picture.id,
    //根据需要设置扩图参数
    parameters: {
      xScale: 2,
      yScale: 2,
    },
  })
  if (res.data.code === 0 && res.data.data) {
    message.success('创建任务成功，请耐心等待，不要退出界面')

    taskId.value = res.data.data.output?.taskId
    //开启轮询查询任务状态
    startPolling()
  } else {
    message.error('创建任务失败 ' + res.data.message)
  }
}

//轮询定时器
let pollingTimer: NodeJS.Timeout = null
const startPolling = () => {
  if (!taskId.value) {
    return
  }
  //每3秒查询一次任务状态
  pollingTimer = setInterval(async () => {
    try {
      const res = await getPictureOutPaintingTaskUsingGet({
        taskId: taskId.value,
      })
      if (res.data.code === 0 && res.data.data) {
        const taskResult = res.data.data.output
        if (taskResult?.taskStatus === 'SUCCEEDED') {
          message.success('扩图任务执行成功')
          resultImageUrl.value = taskResult.outputImageUrl
          //清理轮询
          clearPolling()
        } else if (taskResult?.taskStatus === 'FAILED') {
          message.error('扩图任务执行失败')
          //清理轮询
          clearPolling()
        }
      }
    } catch (error) {
      console.error('扩图任务轮询任务失败', error)
      message.error('扩图任务轮询失败 ' + error.message)
      clearPolling()
    }
  }, 3000)
}

const clearPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
    taskId.value = null
  }
}

const uploadLoading = ref(false)
//图片上传
const handleUpload = async () => {
  uploadLoading.value = true
  try {
    const params: API.PictureUploadRequest = { fileUrl: resultImageUrl.value }
    if (props.picture) {
      params.id = props.picture.id
    }
    if (props.spaceId) {
      params.spaceId = props.spaceId
    }
    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success('图片上传成功')
      //将上传成功的图片信息传递给父组件
      props.onSuccess?.(res.data.data)
      closeModal()
    } else {
      message.error('图片上传失败 ' + res.data.message)
    }
  } catch (error) {
    console.error('图片上传失败', error)
    message.error('图片上传失败' + error.message)
  }
  uploadLoading.value = false
}

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

<style>
.image-out-painting {
  text-align: center;
}
</style>
