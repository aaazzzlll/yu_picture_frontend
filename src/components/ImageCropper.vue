<template>
  <a-modal
    class="image-cropper"
    v-model:open="open"
    title="编辑图片"
    :footer="null"
    @cancel="closeModal"
  >
    <!-- 比例选择 -->
    <div class="aspect-ratio-selector">
      <a-radio-group v-model:value="aspectRatio" button-style="solid">
        <a-radio-button value="free">自由比例</a-radio-button>
        <a-radio-button value="1:1">1:1</a-radio-button>
        <a-radio-button value="4:3">4:3</a-radio-button>
        <a-radio-button value="16:9">16:9</a-radio-button>
        <a-radio-button value="3:4">3:4</a-radio-button>
        <a-radio-button value="9:16">9:16</a-radio-button>
      </a-radio-group>
    </div>
    <div style="margin-bottom: 16px"></div>
    <!-- 图片裁切组件 -->
    <vue-cropper
      ref="cropperRef"
      :img="imageUrl"
      output-type="png"
      :info="true"
      :can-move-box="true"
      :fixed-box="false"
      :auto-crop="true"
      :center-box="true"
      :fixed="aspectRatio !== 'free'"
      :fixedNumber="currentAspectRatio"
    />
    <div style="margin-bottom: 16px"></div>
    <!-- 图片操作 -->
    <div class="image-cropper-actions">
      <a-space>
        <a-button @click="rotateLeft">向左旋转</a-button>
        <a-button @click="rotateRight">向右旋转</a-button>
        <a-button @click="changeScale(1)">放大</a-button>
        <a-button @click="changeScale(-1)">缩小</a-button>
        <a-button @click="handleConfirm" :loading="loading" type="primary">确认</a-button>
      </a-space>
    </div>
  </a-modal>
</template>
<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController'

interface Props {
  imageUrl?: string
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
  spaceId?: number
}
const props = defineProps<Props>()

//获取裁切组件实例
const cropperRef = ref()

//缩放比例
const changeScale = (num) => {
  cropperRef.value?.changeScale(num)
}

//向左旋转
const rotateLeft = () => {
  cropperRef.value?.rotateLeft()
}

//向右旋转
const rotateRight = () => {
  cropperRef.value?.rotateRight()
}

//保存当前选择的比例
const aspectRatio = ref('free')
//计算当前宽高比
const currentAspectRatio = computed(() => {
  if (aspectRatio.value === 'free') {
    return [0, 0]
  }
  const [width, height] = aspectRatio.value.split(':').map(Number)
  return [width, height]
})

// 监听比例变化，手动重置裁剪框
watch(aspectRatio, () => {
  if (aspectRatio.value !== 'free') {
    // 强制刷新裁剪框配置
    cropperRef.value?.goAutoCrop()
  }
})

//确认裁切
const handleConfirm = () => {
  cropperRef.value?.getCropBlob((blob: Blob) => {
    //blob为已经裁切好的文件
    const fileName = (props.picture?.name || 'image') + '.png'
    const file = new File([blob], fileName, { type: blob.type })
    //上传图片
    handleUpload({ file })
  })
}

const loading = ref(false)

//图片上传
const handleUpload = async ({ file }: any) => {
  loading.value = true
  try {
    const params: API.PictureUploadRequest = props.picture ? { id: props.picture.id } : {}
    params.spaceId = props.spaceId
    const res = await uploadPictureUsingPost(params, {}, file)
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
  loading.value = false
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
.image-cropper {
  text-align: center;
}
.image-cropper .vue-cropper {
  height: 400px !important;
}
</style>
