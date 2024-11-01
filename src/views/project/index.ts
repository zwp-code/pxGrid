import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, onActivated, watch } from 'vue';
import NewProjectDialog from '@/components/dialog/NewProjectDialog.vue';
import { useEditSpaceStore } from '@/store';
import Worker from '@/utils/worker.js?worker';
import { ArrowDownBold } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import FileSaver from 'file-saver';
import { formatTime } from '@/utils/utils';
import { uuid } from 'vue-uuid';
export default defineComponent({
    name:'project',
    components: {
        NewProjectDialog
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        // const useDBHooks = useDB();
        let data = reactive({
            isExporting:false,
            NewProjectVisible:false,
            editProjectInfo:null as any,
            isloading:false
        });


        const computedApi = {
            getFrameImg: computed(() => 
            {
                return (value) => 
                {
                    if (value && value !== '')
                    {
                        return value;
                    }
                    return require('@/assets/grid.png');
                };
            })
        };
     
       
        let methods = {
            // getProjectData ()
            // {
            //     let projectData = proxy.$utils.cache.project.get();
            //     if (projectData)
            //     {
            //         editSpaceStore.projectList = JSON.parse(projectData);
            //     }
            // },
            async handleOpenProject (project)
            {
                // editSpaceStore.saveProjectId(project.projectId);
                proxy.$router.push({
                    name:'work',
                    params:{
                        projectId:project.projectId
                    }
                });
                // project.tip = '';
                // try
                // {
                //     await editSpaceStore.saveProject(project);
                //     editSpaceStore.saveProjectId(project.projectId);
                //     proxy.$router.push({
                //         name:'work',
                //         params:{
                //             projectId:project.projectId
                //         }
                //     });
                // }
                // catch (err)
                // {
                //     proxy.$message.error('打开项目失败 - ' + err);
                // }
            },
            async handleTopProject (projectData)
            {
                let cloneData = JSON.parse(JSON.stringify(projectData));
                cloneData.isTop = projectData.isTop === 0 ? 1 : 0;
                try
                {
                    await editSpaceStore.saveProject(cloneData);
                    proxy.$message.success(`${!cloneData.isTop ? '已取消置顶' : '已置顶'}`);
                }
                catch (err)
                {
                    proxy.$message.error('置顶失败 - ' + err);
                }
            },
            handleEditProject (projectData)
            {
                data.editProjectInfo = JSON.parse(JSON.stringify(projectData));
                data.NewProjectVisible = true;
            },
            handleExportProject (projectData)
            {
                data.isExporting = true;
                const d = JSON.stringify(projectData);
                const blob = new Blob([d], {type: ''});
                FileSaver.saveAs(blob, `${projectData.projectName}.json`);
                proxy.$message.success('导出成功');
                data.isExporting = false;
            },
            handleDeleteProject (projectId)
            {
                ElMessageBox.confirm(
                    '是否删除该项目？',
                    '提 示',
                    {
                        confirmButtonText: '确 认',
                        cancelButtonText: '取 消',
                        type: 'warning'
                    }
                )
                    .then(() => 
                    {
                        editSpaceStore.deleteProjectById(projectId).then((res) => 
                        {
                            if (res) proxy.$message.success('删除成功');
                        }).catch((err) => 
                        {
                            proxy.$message.error('删除失败 - ' + err);
                        });
                    })
                    .catch(() => 
                    {
                        //
                    });
            },
            handleImportProject ()
            {
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.addEventListener('change', function () 
                {
                    const file = input.files[0];
                    if (file) 
                    {
                        data.isloading = true;
                        const reader = new FileReader();
                        reader.onload = function (e:any) 
                        {
                            const jsonData = JSON.parse(e.target.result);
                            jsonData.projectId = uuid.v1();
                            jsonData.createAt = formatTime();
                            jsonData.updateAt = jsonData.createAt;
                            jsonData.tip = '新项目';
                            editSpaceStore.saveProject(jsonData).then((res) => 
                            {
                                if (res) 
                                {
                                    proxy.$message.success(proxy.$t('message.importSucceeded'));
                                    data.isloading = false;
                                    
                                    // proxy.$router.push({
                                    //     name:'work',
                                    //     params:{
                                    //         projectId:data.itemInfo.projectId
                                    //     }
                                    // });
                                    // editSpaceStore.saveProjectId(data.itemInfo.projectId);
                                }
                            }).catch((err) => 
                            {
                                console.log(err);
                                proxy.$message.error(proxy.$t('message.importFailed'));
                                data.isloading = false;
                            });
                        };
                        reader.readAsText(file);
                        
                    }
                });
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            }
        };
        
        onMounted(() => 
        {
            // methods.getProjectData();
        });

        // onActivated(() => 
        // {
        //     methods.getProjectData();
        // });

        return {
            ...toRefs(data),
            ...methods,
            editSpaceStore,
            ArrowDownBold,
            ...computedApi

        };
    }
});