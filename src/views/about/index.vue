<template>
    <div 
    class="full-layout flex-start scrollbar routerview"
    :class="{ 'web-gray': checkDate('公祭日') }"
    style="position: relative;">
        <div class="flex-start-cv full-layout">
            <div class="full-layout pad-1 scrollAuto scrollbar" v-if="!checkIsClientEnv()">
                <h1># {{$t('message.update')}}</h1>

                <el-timeline>
                    <el-timeline-item
                    v-for="item in updates" :key="item.time"
                    :timestamp="item.time" 
                    placement="top"
                    >
                        <p style="white-space: pre-wrap;line-height:2;">{{ item.msg.zh }}</p>
                    </el-timeline-item>
                </el-timeline>
                
            </div>
            <div class="full-layout pad-1 scrollAuto scrollbar">
                <h1># {{$t('message.link')}}</h1>
                <div class="flex-start flex-warp" style="gap:15px">
                    <el-link
                    :underline="false"
                    class="link"
                    v-for="item in links"
                    :key="item.url"
                    :type="item.type.slice(0,1) === '#' ? '' : item.type"
                    :style="{color:item.type.slice(0,1) === '#' ? item.type : ''}"
                    @click="handleOpen(item.url)">{{item.label}}</el-link>
                </div>

                <h2># {{$t('message.donate')}}</h2>
                <div class="flex-warp flex-start thanks-box">
                    <div v-for="item in donates" :key="item.id">
                        <el-link :href="item.link||'#'"  :underline="false" class="flex-center" type="success">
                            <el-avatar 
                            :src="item.avatar || require('@/assets/boy.png')" 
                            :size="30"/>
                            {{ item.name }}(￥{{item.amount}})
                        </el-link>
                    </div>
                </div>
            </div>
        </div>
        
        <HomeFooter></HomeFooter>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss">
h1, h2 {
    margin: 0 0 20px;
}

h2 {
    margin-top: 50px;
}

.pad-1 {
    padding: 50px;
    flex: 1;

    .time {
        font-size: 14px;
        color: var(--el-text-color-second);
    }
}

.pad-2 {
    padding: 0 50px;
    flex: 1;
}

.link {
    // margin-bottom: 5px;
    // color: var(--el-text-color-second);
    font-weight: 600;
}

.link, .thank+.thank {
    // margin-left: 10px;
}

.thanks-box {
    padding-top: 1rem;
    grid-gap: 1rem;
    gap: 1rem;

    :deep(.el-link__inner) {
        gap: 0.5rem;
    }

    .el-avatar--circle {
        min-width: 30px;
    }
}


</style>
