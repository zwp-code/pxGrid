import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, onActivated, watch, watchEffect, onDeactivated } from 'vue';
import NewProjectDialog from '@/components/dialog/NewProjectDialog.vue';
import { useEditSpaceStore } from '@/store';
import Worker from '@/utils/worker.js?worker';
import { ArrowDownBold } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import FileSaver from 'file-saver';
import { formatTime, getRequestUrl } from '@/utils/utils';
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
            isloading:true,
            searchValue:'',
            searchData:[] as any,
            loadingText:'正在加载...'
        });


        const computedApi = {
            getFrameImg: computed(() => 
            {
                return (value) => 
                {
                    if (value.frameImg[0] === '/')
                    {
                        return `${getRequestUrl()}moduleImg${value.frameImg}`;
                    }
                    if (value.data[0].currentFrameImg !== '')
                    {
                        if (value.data[0].currentFrameImg === null) return require('@/assets/grid.png');
                        return value.data[0].currentFrameImg;
                    }
                    // if (value.frameImg === '@')
                    // {
                    //     return require('@/assets/grid.png');
                    // }
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
            handleSearch ()
            {
                if (data.searchValue.trim() === '') return proxy.$message.warning('请输入内容');
                let reg = new RegExp(data.searchValue, 'i');
                data.searchData = editSpaceStore.projectList.filter((item) => 
                {
                    return reg.test(item.data.projectName);
                });
            },
            async handleOpenProject (project)
            {
                // editSpaceStore.saveProjectId(project.projectId);
                data.isloading = true;
                data.loadingText = '正在打开项目';
                setTimeout(() => 
                {
                    data.loadingText = '首次打开项目会比较慢，请耐心等待！';
                }, 5000);
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
                        const imageTypes = [
                            'image/jpeg',
                            'image/png',
                            'image/gif',
                            'image/bmp',
                            'image/svg+xml'
                        ];
                        if (imageTypes.includes(file.type)) return proxy.$message.warning('导入文件格式不正确，确保导入的是项目文件而非图片文件');
                        data.isloading = true;
                        data.loadingText = '正在导入项目';
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

        watchEffect(() => 
        {
            if (data.searchValue.trim() === '')
            {
                data.searchData = [];
            }
        });

        watch(() => editSpaceStore.isQueryProjectData, (newValue, oldValue) => 
        {
            console.log(newValue);
            
            if (newValue === '1' || newValue === '2')
            {
                data.isloading = false;
            }
        }, {
            immediate:true
        });
        
        onMounted(() => 
        {
            // methods.getProjectData();
            console.log('项目列表', editSpaceStore.projectList);
            
        });

        // onActivated(() => 
        // {
        //     methods.getProjectData();
        // });
        onDeactivated(() => 
        {
            data.isloading = false;
        });
        
        return {
            ...toRefs(data),
            ...methods,
            editSpaceStore,
            ArrowDownBold,
            ...computedApi

        };
    }
});