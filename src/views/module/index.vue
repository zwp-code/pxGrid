<template>
    <div 
    class="full-layout scrollbar routerview flex-center">
        <div class="full-layout flex flex-column"
         v-loading="isloading"
         :element-loading-text="loadingText"
        element-loading-background="#00000000">
            <div class="flex-start searchBox">
                <div class="input-search">
                    <el-icon><Search /></el-icon>
                    <input type="text" v-model="searchValue" placeholder="请搜索像素资源" @keyup.enter="search">
                </div>
                <el-select 
                v-model="filterValue" placeholder="请选择分类" 
                size="large"
                @change="handleFilter"
                class="select"
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="3"
                multiple>
                    <el-option
                        v-for="item in filterOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <button class="pixelButton" @click="handleReset">重 置</button>
                <div style="margin-left:5px">
                    <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="15"
                    background
                    layout="total, prev, pager, next"
                    :hide-on-single-page="true"
                    :total="total"
                    @current-change="handleCurrentChange"
                    />
                </div>
            </div>
            <div class="full-layout scrollbar grid-box scrollAuto"
            v-if="searchData.length && !isloading">
                <div v-for="item in searchData" :key="item.id" class="download-item">
                    <div class="frameImg">
                        <!-- <img :src="getFrameImg(item.data.frameImg)"/> -->
                        <el-image :src="getFrameImg(item.data.frameImg)" fit="contain">
                            <template #placeholder>
                                <el-skeleton animated class="full-layout">
                                    <template #template>
                                        <el-skeleton-item variant="image" style="height:100%"/>
                                    </template>
                                </el-skeleton>
                            </template>
                        </el-image>
                        <img :src="require('@/assets/hot.png')" class="top" v-if="item.data.isTop"/>
                        <el-tag type="success" class="size">{{item.data.width}}x{{item.data.height}}</el-tag>
                        <el-tag type="danger" v-if="item.data.tip!==''" class="tip">{{ item.data.tip }}</el-tag>
                        <div class="author flex-start">
                            <img :src="getAuthorImg(item.author.avatar)">
                            <p class="oneline">{{item.author.nickname}}</p>
                        </div>
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
                                        <el-dropdown-item @click="handleImport(item.data)" icon="FolderAdd">{{ $t('message.import')}}</el-dropdown-item>
                                        <el-dropdown-item @click="handlePreview(item.data)" icon="View">{{ $t('message.preview')}}</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                        <el-divider border-style="dashed" content-position="left" style="margin:5px 0;">{{ item.data.createAt }}</el-divider>
                        <el-tooltip :content="item.data.desc" effect="light">
                            <div class="twoline" style="font-size: 14px;display: -webkit-inline-box;">
                                <!-- {{ item.desc !== '' ? $t(`message.${item.desc}`) : $t(`message.None`) }} -->
                                {{ item.data.desc }} 
                            </div>
                        </el-tooltip>
                    </div>
                </div>
                
            </div>
            <div v-else-if="!isloading && !searchData.length" 
            class="full-layout flex-center scrollbar scrollAuto">
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
