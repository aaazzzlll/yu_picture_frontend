<template>
  <div class="space-user-analyze">
    <a-card title="空间图片用户分析">
      <v-chart :option="options" style="height: 320px; max-width: 100%" :loading="loading" />
      <template #extra>
        <a-space>
          <a-segmented v-model:value="timeDimension" :options="timeDimensionOptions" />
          <a-input-search
            placeholder="请输入用户 id"
            enter-button="搜索用户"
            @search="doSearch"
          ></a-input-search>
        </a-space>
      </template>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import 'echarts'
import VChart from 'vue-echarts'
import { ref, watchEffect, computed } from 'vue'
import { getSpaceUserAnalyzeUsingPost } from '@/api/spaceAnalyzeController'
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
//时间维度选项
const timeDimension = ref<'day' | 'week' | 'month'>('day')
//分段选择器组件的选项
const timeDimensionOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
]

//用户id
const userId = ref<string>()
const doSearch = (value: string) => {
  userId.value = value
}

//图表数据
const dataList = ref<API.SpaceUserAnalyzeResponse[]>([])

//加载状态
const loading = ref(false)

//获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceUserAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
    timeDimension: timeDimension.value,
    userId: userId.value,
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
  const periods = dataList.value.map((item) => item.period) // 时间区间
  const counts = dataList.value.map((item) => item.count) // 上传数量

  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: periods, name: '时间区间' },
    yAxis: { type: 'value', name: '上传数量' },
    series: [
      {
        name: '上传数量',
        type: 'line',
        data: counts,
        smooth: true, // 平滑折线
        emphasis: {
          focus: 'series',
        },
      },
    ],
  }
})
</script>

<style scoped></style>
