<template>
  <div class="space-size-analyze">
    <a-card title="空间图片大小分析">
      <v-chart :option="options" style="height: 320px; max-width: 100%" :loading="loading" />
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import 'echarts'
import VChart from 'vue-echarts'
import { ref, watchEffect, computed } from 'vue'
import { getSpaceSizeAnalyzeUsingPost } from '@/api/spaceAnalyzeController'
import { message } from 'ant-design-vue'
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
const dataList = ref<API.SpaceSizeAnalyzeResponse[]>([])

//加载状态
const loading = ref(false)

//获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceSizeAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
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

// 图表选项
const options = computed(() => {
  const pieData = dataList.value.map((item) => ({
    name: item.sizeRange,
    value: item.count,
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      top: 'bottom',
    },
    series: [
      {
        name: '图片大小',
        type: 'pie',
        radius: '50%',
        data: pieData,
      },
    ],
  }
})
</script>

<style scoped></style>
