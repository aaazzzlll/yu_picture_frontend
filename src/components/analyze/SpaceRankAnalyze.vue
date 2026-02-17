<template>
  <div class="space-rank-analyze">
    <a-card title="空间使用排行分析">
      <v-chart
        :option="options"
        style="height: 320px; max-width: 100%"
        :loading="loading"
        @click="onChartClick"
      />
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import 'echarts'
import VChart from 'vue-echarts'
import { ref, watchEffect, computed } from 'vue'
import { getSpaceRankAnalyzeUsingPost } from '@/api/spaceAnalyzeController'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

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
const dataList = ref<API.Space[]>([])

//加载状态
const loading = ref(false)

//获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceRankAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
    topN: 10, //后端默认是10
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
  const spaceNames = dataList.value.map((item) => item.spaceName)
  const usageData = dataList.value.map((item) => {
    return {
      value: (item.totalSize / (1024 * 1024)).toFixed(2),
      id: item.id, // 将 id 埋入数据点中
    }
  }) // 转为 MB

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: spaceNames,
    },
    yAxis: {
      type: 'value',
      name: '空间使用量 (MB)',
    },
    series: [
      {
        name: '空间使用量 (MB)',
        type: 'bar',
        data: usageData,
        itemStyle: {
          color: '#5470C6', // 自定义柱状图颜色
        },
      },
    ],
  }
})
const router = useRouter()

//点击事件
const onChartClick = (params: any) => {
  const { data } = params
  if (!data?.id) return
  //跳转到空间分析页面
  router.push(`/space/analyze?spaceId=${data.id}`)
}
</script>

<style scoped></style>
