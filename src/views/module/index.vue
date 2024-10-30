<template>
    <div 
    class="full-layout scrollbar routerview flex-start flex-warp" 
    style="align-content: flex-start;align-items:flex-start;overflow: auto;">
        <div v-for="item in toolList" :key="item.id" class="download-item">
            <div class="flex-between">
                <h3 class="oneline" :title="item.label">{{item.label }}</h3>
                <el-button 
                type="primary" 
                :icon="Download" 
                circle 
                style="margin-left:5px"
                @click="handleOpen(item.link)"/>
            </div>
            <el-divider border-style="dashed" />
            <el-tooltip :content="$utils.cache.lang.get() === 'zh' ? item.desc.zh : item.desc.en" effect="light">
                <div class="twoline" style="font-size: 14px;display: -webkit-inline-box;">
                    <!-- {{ item.desc !== '' ? $t(`message.${item.desc}`) : $t(`message.None`) }} -->
                    {{ $utils.cache.lang.get() === 'zh' ? item.desc.zh : item.desc.en }} 
                </div>
            </el-tooltip>
            
            
        </div>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss" src="./index.scss">

</style>
