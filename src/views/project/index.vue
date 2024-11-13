<template>
    <div class="full-layout flex-center scrollbar routerview">
        <div class="full-layout flex flex-column" v-loading="isloading" element-loading-background="#00000000">
            <div class="flex-between flex-warp" style="padding:20px 30px 10px;row-gap: 10px;">
                <h2>{{$t('message.mineProject')}}</h2>
                <div class="flex-end">
                    <el-button type="primary"  @click="handleImportProject">{{ $t('message.importProject') }}</el-button>
                    <el-button type="primary"  @click="NewProjectVisible=true">{{ $t('message.newProject') }}</el-button>
                </div>
            </div>
            <div class="full-layout scrollbar flex-start flex-warp scrollAuto"
            v-if="editSpaceStore.projectList.length && !isloading" 
            style="align-content: flex-start;
            align-items:flex-start;
            gap:10px;
            padding:10px 18px">
                <div v-for="item in editSpaceStore.projectList" :key="item.id" class="project-item">
                    <div class="frameImg flex-center">
                        <img :src="require('@/assets/grid.png')" v-if="item.data.frameImg===''" class="emptyImg"/>
                        <img :src="getFrameImg(item.data)" v-else class="previewImg"/>
                        <!-- <img :src="require('@/assets/top.png')" class="top" v-if="item.data.isTop"/> -->
                        <el-tag type="danger" effect="dark" v-if="item.data.isTop" class="top">置顶</el-tag>
                        <el-tag type="success" class="size">{{item.data.width}}x{{item.data.height}}</el-tag>
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
                                        <el-dropdown-item @click="handleOpenProject(item.data)" icon="Open">{{ $t('message.open')}}</el-dropdown-item>
                                        <el-dropdown-item @click="handleEditProject(item.data)" icon="Edit">{{ $t('message.edit')}}</el-dropdown-item>
                                        <el-dropdown-item @click="handleTopProject(item.data)" icon="Upload">{{ item.data.isTop > 0 ? $t('message.cancelTop') : $t('message.top')}}</el-dropdown-item>
                                        <el-dropdown-item @click="handleExportProject(item.data)" :disabled="isExporting" icon="FolderOpened">{{ isExporting ? $t('message.exportLoading') : $t('message.export')}}</el-dropdown-item>
                                        <el-dropdown-item @click="handleDeleteProject(item.data.projectId)" icon="Delete">{{ $t('message.delete')}}</el-dropdown-item>
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
            <div 
            v-else-if="!isloading && !editSpaceStore.projectList.length" 
            class="full-layout flex-center scrollbar scrollAuto">
                <el-empty
                :image="require('@/assets/empty.png')"
                description="空空如也"
                :image-size="200"
                />
            </div>
            <NewProjectDialog 
            v-if="NewProjectVisible" 
            :visible="NewProjectVisible"
            :editInfo="editProjectInfo"
            @close="NewProjectVisible=false">
            </NewProjectDialog>
        </div>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss" src="./index.scss">

</style>
