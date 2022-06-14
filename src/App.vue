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
import { reactive, toRefs, onMounted } from 'vue';
import {useStore} from 'vuex';
const store = useStore();
onMounted(() => 
{
    // store.dispatch('user/getUserData');
});
</script>


<style lang='scss' src='@/style/public.scss'>
</style>
