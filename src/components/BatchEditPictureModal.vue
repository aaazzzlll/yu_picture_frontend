<template>
  <div class="batch-edit-picture-modal">
    <a-modal v-model:open="open" title="批量编辑图片" :footer="null" @cancel="closeModal">
      <a-typography-paragraph type="secondary"> * 只对当前页面的图片生效 </a-typography-paragraph>
      <!-- 批量创建表单 -->
      <a-form layout="vertical" :model="formData" @finish="handleSubmit">
        <a-form-item name="category" label="分类">
          <a-auto-complete
            v-model:value="formData.category"
            placeholder="请输入分类"
            :options="categoryOptions"
            allow-clear
          >
          </a-auto-complete>
        </a-form-item>
        <a-form-item name="tags" label="标签">
          <a-select
            v-model:value="formData.tags"
            mode="tags"
            placeholder="请输入标签"
            :options="tagOptions"
            allow-clear
          />
        </a-form-item>
        <a-form-item name="nameRule" label="命名规则">
          <a-input
            v-model:value="formData.nameRule"
            placeholder="请输入命名规则，输入 {序号} 可动态生成"
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%">提交</a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  editPictureByBatchUsingPost,
} from '@/api/pictureController'
import { message } from 'ant-design-vue'

interface Props {
  pictureList: API.PictureVO[]
  spaceId: number
  onSuccess: () => void
}
const props = withDefaults(defineProps<Props>(), {})

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

const formData = reactive<API.PictureEditByBatchRequest>({
  category: '',
  tags: [],
  nameRule: '',
})

const handleSubmit = async (values: API.PictureEditByBatchRequest) => {
  if (!props.pictureList) {
    return
  }
  const res = await editPictureByBatchUsingPost({
    pictureIdList: props.pictureList.map((picture) => picture.id),
    spaceId: props.spaceId,
    ...values,
  })
  //操作成功
  if (res.data.code === 0 && res.data.data) {
    message.success('操作成功')
    closeModal()
    props.onSuccess?.()
  } else {
    message.error('操作失败 ' + res.data.message)
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
})
</script>
