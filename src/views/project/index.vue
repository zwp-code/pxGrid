<template>
    <div class="full-layout flex-center scrollbar routerview">
        <div class="full-layout">
            <div class="flex-between" style="padding:20px">
                <h1>{{$t('message.mineProject')}}</h1>
                <div class="flex-end">
                    <el-button type="primary" size="large" @click="handleImportProject">{{ $t('message.importProject') }}</el-button>
                    <el-button type="primary" size="large" @click="NewProjectVisible=true">{{ $t('message.newProject') }}</el-button>
                </div>
            </div>
            <div class="full-layout scrollbar flex-start flex-warp" 
            style="height: calc(100% - 90px);
            align-content: flex-start;
            align-items:flex-start;
            overflow: auto;
            padding:0 10px">
                <div v-for="item in editSpaceStore.projectList" :key="item.projectId" class="project-item">
        
                    <div class="flex-between">
                        <h3 class="oneline" :title="item.projectName">{{item.projectName }}</h3>
                        <el-dropdown trigger="click" :hide-on-click="false">
                            <el-button 
                            type="primary" 
                            :icon="ArrowDownBold"
                            style="margin-left:5px"/>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="handleOpenProject(item.projectId)" icon="Open">{{ $t('message.open')}}</el-dropdown-item>
                                    <el-dropdown-item @click="handleEditProject(item)" icon="Edit">{{ $t('message.edit')}}</el-dropdown-item>
                                    <el-dropdown-item @click="handleExportProject(item.projectId)" :disabled="isExporting" icon="FolderOpened">{{ isExporting ? $t('message.exportLoading') : $t('message.export')}}</el-dropdown-item>
                                    <el-dropdown-item @click="handleDeleteProject(item.projectId)" icon="Delete">{{ $t('message.delete')}}</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                    <el-divider border-style="dashed" content-position="right">{{ item.updateAt }}</el-divider>
                    <el-tooltip :content="item.desc" effect="light">
                        <div class="twoline" style="font-size: 14px;display: -webkit-inline-box;">
                            <!-- {{ item.desc !== '' ? $t(`message.${item.desc}`) : $t(`message.None`) }} -->
                            {{ item.desc }} 
                        </div>
                    </el-tooltip>
                    
                    
                </div>
            </div>
            <NewProjectDialog 
            v-if="NewProjectVisible" 
            :visible="NewProjectVisible"
            :editInfo="editProjectInfo"
            @save="getProjectData"
            @close="NewProjectVisible=false">
            </NewProjectDialog>
        </div>
    </div>
</template>

<script lang="ts" src='./index.ts'>
</script>

<style scoped lang="scss" src="./index.scss">

</style>
