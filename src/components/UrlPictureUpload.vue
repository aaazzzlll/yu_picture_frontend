<template>
  <div class="url-picture-upload">
    <a-input-group compact>
      <a-input
        v-model:value="fileUrl"
        style="width: calc(100% - 120px)"
        placeholder="请输入图片地址"
        :disabled="props.disabled"
      />
      <a-button
        type="primary"
        style="width: 120px"
        :loading="loading"
        @click="handleUpload"
        :disabled="props.disabled"
        >提交</a-button
      >
    </a-input-group>
    <div class="img-wrapper" v-if="picture">
      <img v-if="picture?.url" :src="picture?.url" alt="avatar" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { uploadPictureByUrlUsingPost } from '@/api/pictureController'

interface Props {
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
  spaceId?: number
  disabled?: boolean
}

const props = defineProps<Props>()
const fileUrl = ref<string>('')
const loading = ref<boolean>(false)

const handleUpload = async () => {
  loading.value = true
  try {
    const params: API.PictureUploadRequest = { fileUrl: fileUrl.value }
    if (props.picture) {
      params.id = props.picture.id
    }
    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success('图片上传成功')
      //将上传成功的图片信息传递给父组件
      props.onSuccess?.(res.data.data)
    } else {
      message.error('图片上传失败 ' + res.data.message)
    }
  } catch (error) {
    console.error('图片上传失败', error)
    message.error('图片上传失败' + error.message)
  }
  loading.value = false
}
</script>

<style scoped>
.url-picture-upload .img-wrapper {
  text-align: center;
  margin-top: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
}
.url-picture-upload .img-wrapper img {
  max-width: 100%;
  max-height: 400px;
}
</style>
