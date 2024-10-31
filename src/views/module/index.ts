import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, watchEffect } from 'vue';
import { Download, ArrowDownBold } from '@element-plus/icons-vue';
import axios from 'axios';
import { base64ToBlob, blobToBase64, downloadFile, sortList } from '@/utils/utils';
export default defineComponent({
    name:'module',
    components: {

    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        let data = reactive({
            moduleList:[],
            isloading:true,
            searchValue:'',
            searchData:[] as any
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
                let reg = new RegExp(data.searchValue, 'i');
                data.searchData = data.moduleList.filter((item:any) => 
                {
                    return reg.test(item.data.projectName) || reg.test(item.data.desc);
                });
                
                if (data.searchData.length === 0)
                {
                    proxy.$message.info('未找到搜索内容 QAQ');
                }
            },
            handleDownload ({ projectId, projectName })
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}project/${projectId}.json`, {
                    responseType: 'blob'
                })
                    .then((res) => 
                    {
                        downloadFile(res.data, 'application/json', projectName);
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
                        
                        data.moduleList = sortList(res.data, 'createAt');
                        data.isloading = false;
                    })
                    .catch((err) => 
                    {
                        proxy.$message.error(err);
                        data.isloading = false;
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
            if (data.searchValue.trim() === '')
            {
                data.searchData = [];
            }
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