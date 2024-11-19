<template>
    <div class="full-layout routerview" v-loading="isloading" element-loading-background="#00000000">
        <iframe
        target="_self"
        id="iframe"
        :src="link"
        :name='name' 
        frameborder='0'
        @load="iframeLoad"
        sandbox="allow-scripts allow-top-navigation allow-same-origin"
        scrolling='yes'>
        </iframe>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss" src="./index.scss">

</style>
