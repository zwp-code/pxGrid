<template>
    <div class="flex-center">
      <el-empty
        :image="require('@/assets/404.png')"
        description="找不到页面"
        :image-size="400"
        >
        <el-button type="primary" @click="$router.replace('/')">返回主页</el-button>
      </el-empty>
    </div>
</template>

<script setup lang="ts">
</script>

<style lang='scss'>
</style>
  