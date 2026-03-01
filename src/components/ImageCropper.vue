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
    <!-- 协同编辑操作 -->
    <div class="image-edit-actions" v-if="isTeamSpace">
      <a-space>
        <a-button v-if="editingUser" disabled>{{ editingUser?.userName }}正在编辑</a-button>
        <a-button v-if="canEnterEdit" type="primary" ghost @click="enterEdit">进入编辑</a-button>
        <a-button v-if="canExitEdit" danger ghost @click="exitEdit">退出编辑</a-button>
      </a-space>
    </div>
    <div style="margin-bottom: 16px"></div>
    <!-- 图片操作 -->
    <div class="image-cropper-actions">
      <a-space>
        <a-button @click="rotateLeft" :disabled="!canEdit">向左旋转</a-button>
        <a-button @click="rotateRight" :disabled="!canEdit">向右旋转</a-button>
        <a-button @click="changeScale(1)" :disabled="!canEdit">放大</a-button>
        <a-button @click="changeScale(-1)" :disabled="!canEdit">缩小</a-button>
        <a-button @click="handleConfirm" :loading="loading" type="primary" :disabled="!canEdit"
          >确认</a-button
        >
      </a-space>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch, watchEffect, onUnmounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import PictureEditWebSocket from '@/utils/pictureEditWebSocket'
import { PICTURE_EDIT_ACTION_ENUM, PICTURE_EDIT_MESSAGE_TYPE_ENUM } from '@/constants/picture'
import { SPACE_TYPE_ENUM } from '@/constants/space'

interface Props {
  imageUrl?: string
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
  spaceId?: number
  space?: API.SpaceVO | null
}
const props = defineProps<Props>()

const isTeamSpace = computed(() => {
  return props.space?.spaceType === SPACE_TYPE_ENUM.TEAM
})

//获取裁切组件实例
const cropperRef = ref()

//缩放比例
const changeScale = (num) => {
  cropperRef.value?.changeScale(num)
  if (num > 0) {
    editAction(PICTURE_EDIT_ACTION_ENUM.ZOOM_IN)
  } else {
    editAction(PICTURE_EDIT_ACTION_ENUM.ZOOM_OUT)
  }
}

//向左旋转
const rotateLeft = () => {
  cropperRef.value?.rotateLeft()
  editAction(PICTURE_EDIT_ACTION_ENUM.ROTATE_LEFT)
}

//向右旋转
const rotateRight = () => {
  cropperRef.value?.rotateRight()
  editAction(PICTURE_EDIT_ACTION_ENUM.ROTATE_RIGHT)
}

//保存当前选择的比例
const aspectRatio = ref('free')
//计算当前宽高比
const currentAspectRatio = computed(() => {
  if (aspectRatio.value === 'free') {
    return [1, 1]
  }
  const [width, height] = aspectRatio.value.split(':').map(Number)
  return [width, height]
})

// 监听比例变化，手动重置裁剪框
watch(aspectRatio, async (newVal) => {
  await nextTick()
  const cropper = cropperRef.value
  if (cropper) {
    if (newVal !== 'free') {
      cropper.goAutoCrop()
    }
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
//关闭弹窗时也需要断开websocket连接，释放资源
const closeModal = () => {
  open.value = false
  // 重置比例为自由比例
  aspectRatio.value = 'free'
  if (websocket) {
    websocket.disconnect()
  }
  editingUser.value = null
}

//暴露函数给父组件
defineExpose({
  openModal,
})

//-------------实时编辑-------------
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser

// 正在编辑的用户
const editingUser = ref<API.UserVO | null>()
// 当前用户是否可进入编辑
const canEnterEdit = computed(() => {
  return !editingUser.value
})

// 正在编辑的用户是本人，可退出编辑
const canExitEdit = computed(() => {
  return editingUser.value?.id === loginUser.id
})

// 可以点击编辑图片的操作按钮
const canEdit = computed(() => {
  //不是团队空间，默认可以编辑
  if (!isTeamSpace.value) {
    return true
  }
  return editingUser.value?.id === loginUser.id
})

//--------------编写WebSocket逻辑----------------
let websocket: PictureEditWebSocket | null

//初始化webSocket连接，绑定监听事件
const initWebsocket = () => {
  const pictureId = props.picture?.id
  if (!pictureId || !open.value) {
    return
  }
  //防止之前的连接未释放
  if (websocket) {
    websocket.disconnect()
  }
  //创建webSocket实例
  websocket = new PictureEditWebSocket(pictureId)
  //建立连接
  websocket.connect()

  //监听一系列事件
  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.INFO, (msg) => {
    console.log('收到通知消息', msg)
    message.info(msg.message)
  })
  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.ERROR, (msg) => {
    console.log('收到错误消息', msg)
    message.error(msg.message)
  })
  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.ENTER_EDIT, (msg) => {
    console.log('收到进入编辑状态的消息', msg)
    message.info(msg.message)
    editingUser.value = msg.user
  })
  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.EXIT_EDIT, (msg) => {
    console.log('收到退出编辑状态的消息', msg)
    message.info(msg.message)
    editingUser.value = null
  })
  websocket.on(PICTURE_EDIT_MESSAGE_TYPE_ENUM.EDIT_ACTION, (msg) => {
    console.log('收到编辑操作的消息', msg)
    message.info(msg.message)
    switch (msg.editAction) {
      case PICTURE_EDIT_ACTION_ENUM.ROTATE_LEFT:
        rotateLeft()
        break
      case PICTURE_EDIT_ACTION_ENUM.ROTATE_RIGHT:
        rotateRight()
        break
      case PICTURE_EDIT_ACTION_ENUM.ZOOM_IN:
        changeScale(1)
        break
      case PICTURE_EDIT_ACTION_ENUM.ZOOM_OUT:
        changeScale(-1)
        break
    }
  })
}

//监听pictureId和open的变化，初始化webSocket连接
watchEffect(() => {
  //只有团队空间才需要初始化webSocket
  if (isTeamSpace.value) {
    initWebsocket()
  }
})

//组件卸载时断开webSocket连接，释放资源
onUnmounted(() => {
  if (websocket) {
    websocket.disconnect()
  }
  editingUser.value = null
})

const enterEdit = () => {
  if (websocket) {
    //发送进入编辑的消息，通知其他用户
    websocket.sendMessage({
      type: PICTURE_EDIT_MESSAGE_TYPE_ENUM.ENTER_EDIT,
    })
  }
}
const exitEdit = () => {
  if (websocket) {
    //发送退出编辑的消息，通知其他用户
    websocket.sendMessage({
      type: PICTURE_EDIT_MESSAGE_TYPE_ENUM.EXIT_EDIT,
    })
  }
}
//编辑图片操作
const editAction = (action: string) => {
  if (websocket) {
    //发送编辑操作的消息，通知其他用户
    websocket.sendMessage({
      type: PICTURE_EDIT_MESSAGE_TYPE_ENUM.EDIT_ACTION,
      editAction: action,
    })
  }
}
</script>

<style>
.image-cropper {
  text-align: center;
}
.image-cropper .vue-cropper {
  height: 400px !important;
}
</style>
