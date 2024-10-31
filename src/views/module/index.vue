<template>
    <div 
    class="full-layout scrollbar routerview flex-center">
        <div class="full-layout" :loading="isloading">
            <div class="flex-start" style="padding:20px 20px 10px;">
                <div class="input-search">
                    <el-icon><Search /></el-icon>
                    <input type="text" v-model="searchValue" placeholder="搜索" @keyup.enter="search">
                </div>
            </div>
            <div class="full-layout scrollbar flex-start flex-warp"
            v-if="moduleList.length" 
            style="height: calc(100% - 90px);
                align-content: flex-start;
                align-items:flex-start;
                overflow: auto;
                padding:0 10px">
                <div v-for="item in searchData.length ? searchData : moduleList" :key="item.id" class="download-item">
                    <div class="frameImg">
                        <img :src="getFrameImg(item.data.frameImg)"/>
                        <img :src="require('@/assets/hot.png')" class="top" v-if="item.data.isTop"/>
                        <el-tag type="primary" class="size">{{item.data.width}}x{{item.data.height}}</el-tag>
                        <el-tag type="primary" effect="dark" v-if="item.data.tip!==''" class="tip">{{ item.data.tip }}</el-tag>
                    </div>
                    <div class="info">
                        <div class="flex-between" style="padding-bottom: 5px;">
                            <h4 class="oneline" :title="item.data.projectName">{{item.data.projectName }}</h4>
                            <el-dropdown trigger="click" size="small">
                                <el-button 
                                type="primary" 
                                :icon="ArrowDownBold"
                                size="small"
                                style="margin-left:5px"/>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item @click="handleDownload(item.data)" icon="Download">{{ $t('message.download')}}</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                        <el-divider border-style="dashed" content-position="left" style="margin:5px 0;">{{ item.data.updateAt }}</el-divider>
                        <el-tooltip :content="item.data.desc" effect="light">
                            <div class="twoline" style="font-size: 14px;display: -webkit-inline-box;">
                                <!-- {{ item.desc !== '' ? $t(`message.${item.desc}`) : $t(`message.None`) }} -->
                                {{ item.data.desc }} 
                            </div>
                        </el-tooltip>
                    </div>
                    
                    
                </div>
            </div>
            <div v-else class="full-layout flex-center">
                <el-empty
                :image="require('@/assets/empty.png')"
                description="空空如也"
                :image-size="200"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss" src="./index.scss">

</style>
