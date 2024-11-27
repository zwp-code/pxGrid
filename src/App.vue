<template>
  <!-- <div
  class="full-layout"
  element-loading-text="加载中"
  v-if="!$store.state.user.isConnect" 
  v-loading.fullscreen.lock="!$store.state.user.isConnect"></div> -->
  <router-view v-slot="{ Component }">
    <keep-alive :exclude="['login']">
      <component :is="Component"></component>
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
import { reactive, toRefs, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import { useEditSpaceStore } from './store';
import cache from './utils/cache';
import { monitorLog } from './utils/utils';
const editSpaceStore = useEditSpaceStore();
// const useDBHooks = useDB();
const { proxy }:any = getCurrentInstance();
const getProjectList  = () =>
{
    // let projectData = cache.project.get();
    // if (projectData)
    // {
    //     editSpaceStore.projectList = JSON.parse(projectData);
    //     console.log(editSpaceStore.projectList);
    // }
    editSpaceStore.getProjectList();
    editSpaceStore.getPindouData();
};

onMounted(() => 
{
    monitorLog();
    getProjectList();
    // 重新刷新重置projectId
    editSpaceStore.saveProjectId('0');
});


</script>


<style lang='scss' src='@/style/public.scss'>
</style>
