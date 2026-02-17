<template>
  <div class="space-usage-analyze">
    <a-flex gap="middle">
      <a-card title="存储空间" style="width: 50%">
        <div style="height: 320px; text-align: center">
          <h3>
            {{ formatSize(data.usedSize) }}/{{ data.maxSize ? formatSize(data.maxSize) : '无限制' }}
          </h3>
          <a-progress type="dashboard" :percent="data.sizeUsageRatio ?? 0"></a-progress>
        </div>
      </a-card>
      <a-card title="图片数量" style="width: 50%">
        <div style="height: 320px; text-align: center">
          <h3>{{ data.usedCount }}/{{ data.maxCount ?? '无限制' }}</h3>
          <a-progress type="dashboard" :percent="data.countUsageRatio ?? 0"></a-progress>
        </div>
      </a-card>
    </a-flex>
  </div>
</template>

<script lang="ts" setup>
import { getSpaceUsageAnalyzeUsingPost } from '@/api/spaceAnalyzeController'
import { ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { formatSize } from '@/utils'
interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

//图表数据
const data = ref<API.SpaceUsageAnalyzeResponse>({})

//加载状态
const loading = ref(false)

//获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceUsageAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    data.value = res.data.data
  } else {
    message.error('获取数据失败 ' + res.data.message)
  }
  loading.value = false
}

/**
 * 这里使用watchEffect监听所有相关参数的变化，如果props中的参数发生变化，就会重新执行fetchData获取最新的数据
 * 这样就保证了当父组件传入的参数发生变化时，图表能够自动更新显示最新的分析结果，而不需要手动刷新页面或者触发其他事件
 */
watchEffect(() => {
  fetchData()
})
</script>

<style scoped></style>
