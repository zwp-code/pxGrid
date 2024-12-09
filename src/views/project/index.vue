<template>
    <div class="full-layout flex-center scrollbar routerview">
        <div class="full-layout flex flex-column" 
        v-loading="isloading"
        :element-loading-text="loadingText"
        element-loading-background="#00000000">
            <div class="flex-between flex-warp" style="padding:20px 20px 10px;row-gap: 10px;">
                <h2>{{$t('message.mineProject')}}</h2>
                <div class="flex-start flex-warp" style="gap:10px;">
                    <el-input v-model="searchValue" clearable :placeholder="$t('message.pleaseSearchProject')" @keyup.enter="handleSearch" style="max-width:150px"></el-input>
                    <el-button type="primary" @click="handleReset">{{ $t('message.reset') }}</el-button>
                    <el-button type="primary" @click="handleBatchExportProject" style="margin-left:0;">{{ $t('message.batchExport') }}</el-button>
                    <el-button type="primary"  @click="UploadFileVisible=true;" style="margin-left:0;">{{ $t('message.importProject') }}</el-button>
                    <el-button type="primary"  @click="NewProjectVisible=true;editProjectInfo=null" style="margin-left:0;">{{ $t('message.newProject') }}</el-button>
                </div>
            </div>
            <template v-if="(editSpaceStore.projectList.length || searchData.length) && !isloading">
                <div class="full-layout scrollbar scrollAuto grid-box"
                @scroll="handleScroll" ref="scroll">
                    <div v-for="item in searchData.length ? searchData : getProjectList"
                    :class="{ 'active': selectedProject.has(item.id) }"
                    @click="handleSelectProject(item.data)"
                    :key="item.id" class="project-item">
                        <div class="frameImg flex-center" @dblclick.stop="handleOpenProject(item.data)">
                            <img :src="require('@/assets/grid.png')" v-if="item.data.frameImg===''" class="emptyImg"/>
                            <img :src="getFrameImg(item.data)" v-else class="previewImg"/>
                            <!-- <img :src="require('@/assets/top.png')" class="top" v-if="item.data.isTop"/> -->
                            <el-tag type="danger" effect="dark" v-if="item.data.isTop" class="top">{{$t('message.top')}}</el-tag>
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
                                    @click.stop
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
                <div class="flex-center full-w" style="padding: 10px;" v-if="!searchData.length">
                    <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    background
                    layout="total, prev, pager, next"
                    :total="totalCount"
                    @current-change="handleCurrentChange"
                    />
                </div>
            </template>
            
            <div 
            v-else-if="!isloading && (!searchData.length || !editSpaceStore.projectList.length)" 
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
            @save="handleOpenProject"
            @close="NewProjectVisible=false">
            </NewProjectDialog>
            <UploadFileDialog 
            v-if="UploadFileVisible" 
            :visible="UploadFileVisible"
            @reload="handleImportProject"
            @close="UploadFileVisible=false">
            </UploadFileDialog>
        </div>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss" src="./index.scss">

</style>
