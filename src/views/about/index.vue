<template>
    <div 
    class="full-layout flex-start scrollbar routerview"
    :class="{ 'web-gray': checkDate('公祭日') }"
    style="position: relative;">
        <div class="flex-start-cv full-layout scrollAuto scrollbar flex-warp">
            <div class="full-w pad-1 scrollAuto scrollbar">
                <h1># {{$t('message.about')}}</h1>
                <p style="line-height:2" class="text-justify">像素格子是一款免费的在线像素编辑器，
                    支持多种功能的绘画，支持一键识别拼豆色号，支持拼豆图纸的导出，
                    支持自定义图片的临摹，支持多种风格图像的导出（精灵图，网格图，GIF动图，拼豆图），
                    同时也支持像素帧动画的制作；
                    <br/><br/>
                    作者：Java<br/>
                    作者QQ：<span style="color:orange" class="pointer" @click="copyText('2152456816')">2152456816</span>（备明来意）
                </p>
            </div>
            
            <div class="full-w pad-1 scrollAuto scrollbar" v-if="links.length && donates.length">
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

                <h2 class="flex-start" style="gap:10px"># {{$t('message.donate')}}
                    ·
                    <el-link type="success" :underline="false" style="font-size:24px;font-weight:400" @click="editSpaceStore.donateVisible=true">{{$t('message.iwantDonate')}}</el-link>
                </h2>
                <div class="flex-warp flex-start thanks-box">
                    <div v-for="item in donates" :key="item.id">
                        <el-link @click="handleOpen(item.link)" :underline="false" class="flex-center" type="success">
                            <el-avatar 
                            :src="item.avatar || require('@/assets/boy.png')" 
                            :size="30"/>
                            {{ item.name }}(￥{{item.amount}})
                        </el-link>
                    </div>
                </div>
            </div>

            <div class="full-layout pad-1 scrollAuto scrollbar" v-if="!checkIsClientEnv() && updates.length">
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
    padding: 30px;
    min-width: 350px;
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
