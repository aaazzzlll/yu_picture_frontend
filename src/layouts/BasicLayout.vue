<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout>
        <GlobalSider class="sider" />
        <a-layout-content class="content">
          <router-view />
        </a-layout-content>
      </a-layout>
      <a-layout-footer class="footer">
        <a href="https://www.codefather.cn" target="_blank">编程导航 by 程序员鱼皮</a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalSider from '@/components/GlobalSider.vue'
</script>

<style scoped>
#basicLayout .header {
  padding-inline: 20px;
  background: white;
  color: unset;
  margin-bottom: 1px;
}
#basicLayout .sider {
  padding-top: 20px;
  background: #fff;
  border-right: 0.5px solid #eee;
}
#basicLayout :deep(.ant-layout-root) {
  border-bottom: none !important;
  border-inline-end: none !important;
}
#basicLayout .content {
  padding: 28px;
  background: linear-gradient(to right, #efefef, #fff);
}
#basicLayout .footer {
  background: #efefef;
  padding: 16px;
  text-align: center;
}
</style>
