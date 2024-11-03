import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, watchEffect } from 'vue';
import { Download, ArrowDownBold } from '@element-plus/icons-vue';
import axios from 'axios';
import { base64ToBlob, blobToBase64, downloadFile, formatTime, sortList } from '@/utils/utils';
import { uuid } from 'vue-uuid';
import { useEditSpaceStore } from '@/store';
export default defineComponent({
    name:'module',
    components: {

    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            moduleList:[],
            isloading:true,
            searchValue:'',
            searchData:[] as any,
            filterValue:0,
            filterOptions:[
                { value:0, label:'全部' },
                { value:1, label:'低分辨率' },
                { value:2, label:'中分辨率' },
                { value:3, label:'高分辨率' }
            ]
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
            search ()
            {
                if (data.searchValue.trim() === '') return proxy.$message.warning('请输入搜索词');
                // let reg = new RegExp(data.searchValue, 'i');
                // data.searchData = data.moduleList.filter((item:any) => 
                // {
                //     return reg.test(item.data.projectName) || reg.test(item.data.desc);
                // });
                methods.handleFilter(data.filterValue);
                // if (data.searchData.length === 0)
                // {
                //     proxy.$message.info('未找到搜索内容 QAQ');
                // }
            },
            handleDownload ({ projectId, projectName, frameImg })
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}project/${projectId}.json`)
                    .then((res) => 
                    {
                        let projectData = res.data;
                        projectData.frameImg = frameImg;
                        console.log(projectData);
                        downloadFile(JSON.stringify(projectData), 'application/json', projectName);
                    })
                    .catch((err) => 
                    {
                        proxy.$message.error('下载失败 - ' + err);
                        console.error(err);
                    });
            },
            getData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/module.json`)
                    .then((res) => 
                    {
                        console.log(res.data);
                        data.isloading = false;
                        data.moduleList = sortList(res.data, 'createAt');
                        methods.handleFilter(data.filterValue);
                    })
                    .catch((err) => 
                    {
                        proxy.$message.error(err);
                        data.isloading = false;
                        console.error(err);
                    });
            },
            filterData (arr, max, min)
            {
                let reg = new RegExp(data.searchValue, 'i');
                let d = arr.filter((item:any) => 
                {
                    if (data.searchValue !== '')
                    {
                        return (reg.test(item.data.projectName) || reg.test(item.data.desc)) && (item.data.width * item.data.height <= max && item.data.width * item.data.height > min);
                    }
                    return item.data.width * item.data.height <= max && item.data.width * item.data.height > min;
                });
                if (!d.length) 
                {
                    // d = arr;
                    proxy.$message.info('未找到相关内容 QAQ');
                }
                return d;
            },
            handleFilter (e)
            {
                if (data.filterValue === 0)
                {
                    data.searchData = methods.filterData(data.moduleList, 70 * 70, 6 * 6);
                }
                else if (data.filterValue === 1)
                {
                    data.searchData =  methods.filterData(data.moduleList, 20 * 20, 6 * 6);
                }
                else if (data.filterValue === 2)
                {
                    data.searchData =  methods.filterData(data.moduleList, 40 * 40, 20 * 20);
                }
                else if (data.filterValue === 3)
                {
                    data.searchData = methods.filterData(data.moduleList, 70 * 70, 40 * 40);
                }

            },
            handleReset ()
            {
                data.searchValue = '';
                data.filterValue = 0;
                methods.handleFilter(data.filterValue);
            },
            handleImport (projectData)
            {
                // 导入到我的项目
                axios.get(`${import.meta.env.VITE_APP_API_URL}project/${projectData.projectId}.json`)
                    .then((res) => 
                    {
                        let jsonData = res.data;
                        jsonData.createAt = formatTime();
                        jsonData.updateAt = jsonData.createAt;
                        jsonData.projectId = uuid.v1();
                        jsonData.tip = '新项目';
                        jsonData.isTop = 0;
                        jsonData.frameImg = projectData.frameImg;
                        editSpaceStore.saveProject(jsonData).then((res1) => 
                        {
                            if (res1) 
                            {
                                proxy.$message.success(proxy.$t('message.importSucceeded'));
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
                        });
                        
                    })
                    .catch((err) => 
                    {
                        proxy.$message.error('下载失败 - ' + err);
                        console.error(err);
                    });
                
            }
        };
        
        onMounted(() => 
        {
            methods.getData();
            
        });

        watchEffect(() => 
        {
            // if (data.searchValue.trim() === '')
            // {
            //     data.searchData = [];
            //     methods.handleFilter(data.filterValue);
            // }
        });

        return {
            ...toRefs(data),
            ...methods,
            Download,
            ArrowDownBold,
            ...computedApi
        };
    }
});