<template>
  <div id="AddPicturePage">
    <h2 style="margin-bottom: 16px">
      {{ route.query?.id ? '修改图片' : '创建图片' }}
    </h2>
    <a-typography-paragraph v-if="spaceId" type="secondary">
      保存至空间：<a :href="`/space/${spaceId}`" target="_blank">{{ spaceId }}</a>
    </a-typography-paragraph>
    <!-- 扩展功能：空间容量提示条 -->
    <a-alert
      v-if="space"
      :message="`空间容量：${formatSize(space.totalSize)} / ${formatSize(space.maxSize)}`"
      :type="isSpaceFull ? 'error' : 'info'"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #description>
        <a-progress
          :percent="((space.totalSize / space.maxSize) * 100).toFixed(2)"
          :status="isSpaceFull ? 'exception' : 'active'"
        />
        <div v-if="isSpaceFull" style="color: red; margin-top: 8px">
          空间已满，请升级空间或删除旧图片后再上传！
        </div>
      </template>
    </a-alert>
    <!-- 选择上传方式 -->
    <a-tabs v-model:activeKey="uploadType">
      <a-tab-pane key="file" tab="文件上传">
        <!-- 图片上传组件 -->
        <PictureUpload
          :picture="picture"
          :onSuccess="onSuccess"
          :spaceId="spaceId"
          :disabled="isSpaceFull"
        />
      </a-tab-pane>
      <a-tab-pane key="url" tab="URL上传" force-render>
        <!-- URL图片上传组件 -->
        <UrlPictureUpload
          :picture="picture"
          :onSuccess="onSuccess"
          :spaceId="spaceId"
          :disabled="isSpaceFull"
        />
      </a-tab-pane>
    </a-tabs>

    <!-- 图片编辑区域 -->
    <div v-if="picture" class="edit-bar">
      <a-space>
        <a-button :icon="h(EditOutlined)" @click="doEditPicture">编辑图片</a-button>
        <a-button type="primary" :icon="h(FullscreenOutlined)" @click="doImagePainting"
          >AI 扩图</a-button
        >
      </a-space>
      <ImageCropper
        ref="imageCropperRef"
        :imageUrl="picture?.url"
        :picture="picture"
        :spaceId="spaceId"
        :onSuccess="onPropSuccess"
      />
      <ImageOutPainting
        ref="imageOutPaintingRef"
        :picture="picture"
        :spaceId="spaceId"
        :onSuccess="onImageOutPaintingSuccess"
      />
    </div>

    <!-- 图片信息表单 -->
    <a-form v-if="picture" layout="vertical" :model="pictureForm" @finish="handleSubmit">
      <a-form-item name="name" label="名称">
        <a-input v-model:value="pictureForm.name" placeholder="请输入名称" allow-clear />
      </a-form-item>
      <a-form-item name="introduction" label="简介">
        <a-textarea
          v-model:value="pictureForm.introduction"
          placeholder="请输入简介"
          :auto-size="{ minRows: 2, maxRows: 5 }"
          allow-clear
        ></a-textarea>
      </a-form-item>
      <a-form-item name="category" label="分类">
        <a-auto-complete
          v-model:value="pictureForm.category"
          placeholder="请输入分类"
          :options="categoryOptions"
          allow-clear
        >
        </a-auto-complete>
      </a-form-item>
      <a-form-item name="tags" label="标签">
        <a-select
          v-model:value="pictureForm.tags"
          mode="tags"
          placeholder="请输入标签"
          :options="tagOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">{{
          route.query?.id ? '修改' : '创建'
        }}</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController'
import PictureUpload from '@/components/PictureUpload.vue'
import { reactive, ref, onMounted, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import UrlPictureUpload from '@/components/UrlPictureUpload.vue'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController'
import { formatSize } from '@/utils'
import ImageCropper from '@/components/ImageCropper.vue'
import { EditOutlined, FullscreenOutlined } from '@ant-design/icons-vue'
import ImageOutPainting from '@/components/ImageOutPainting.vue'

const route = useRoute()
const router = useRouter()

const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})
const uploadType = ref<'file' | 'url'>('file')
//空间id
const spaceId = computed(() => {
  return route.query?.spaceId
})
const space = ref<API.SpaceVO | null>(null)

//获取空间信息
const fetchSpaceDetail = async () => {
  if (!spaceId.value) return
  try {
    const res = await getSpaceVoByIdUsingGet({ id: spaceId.value })
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    }
  } catch (e: any) {
    message.error('获取空间详情失败 ' + e.message)
  }
}

const isSpaceFull = computed(() => {
  if (!space.value) return false

  const total = Number(space.value.totalSize) || 0
  const max = Number(space.value.maxSize) || 0
  return total >= max
})
/*
图片上传成功
*/
const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

const handleSubmit = async (values: API.PictureEditRequest) => {
  console.log(values)
  const pictureId = picture.value?.id
  if (!pictureId) {
    return
  }
  const res = await editPictureUsingPost({
    id: pictureId,
    ...values,
  })
  //操作成功
  if (res.data.code === 0 && res.data.data) {
    message.success('创建成功')
    //跳转到图片详情页
    router.push({
      path: `/picture/${pictureId}`,
    })
  } else {
    message.error('创建失败 ' + res.data.message)
  }
}

const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])

/*
获取标签和分类选项
*/
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagOptions.value = (res.data.data.tagList ?? []).map((item: string) => {
      return {
        value: item,
        label: item,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((item: string) => {
      return {
        value: item,
        label: item,
      }
    })
  } else {
    message.error('获取标签分类列表失败 ' + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
  if (spaceId.value) {
    fetchSpaceDetail()
  }
})

//获取老数据
const getOldPicture = async () => {
  const id = route.query?.id
  if (id) {
    const res = await getPictureVoByIdUsingGet({ id })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      picture.value = data
      pictureForm.name = data.name
      pictureForm.introduction = data.introduction
      pictureForm.category = data.category
      pictureForm.tags = data.tags
    }
  }
}

onMounted(() => {
  getOldPicture()
})

//-------------图片编辑器引用-------------
const imageCropperRef = ref()

//编辑图片
const doEditPicture = () => {
  imageCropperRef.value?.openModal()
}

const onPropSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}

//-------------AI扩图引用-------------
const imageOutPaintingRef = ref()

//打开AI扩图弹窗
const doImagePainting = () => {
  imageOutPaintingRef.value?.openModal()
}
//AI扩图成功回调
const onImageOutPaintingSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
}
</script>

<style scoped>
#AddPicturePage {
  max-width: 720px;
  margin: 0 auto;
}
#AddPicturePage .edit-bar {
  text-align: center;
  margin: 16px 0;
}
</style>
