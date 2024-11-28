import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, watchEffect } from 'vue';
import { Download, ArrowDownBold } from '@element-plus/icons-vue';
import axios from 'axios';
import { base64ToBlob, blobToBase64, downloadFile, formatTime, getRequestUrl, sortList } from '@/utils/utils';
import { uuid } from 'vue-uuid';
import { useEditSpaceStore } from '@/store';
export default defineComponent({
    name:'pindou',
    components: {

    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            list:[],
            isloading:true,
            searchValue:'',
            searchData:[] as any,
            filterValue:[0],
            filterOptions:[
                { value:0, label:'全部' },
                { value:1, label:'低分辨率' },
                { value:2, label:'中分辨率' },
                { value:3, label:'高分辨率' },
                { value:4, label:'动态' },
                { value:5, label:'静态' }
            ],
            currentPage:1,
            total:0
        });

        const computedApi = {
            getFrameImg: computed(() => 
            {
                return (value) => 
                {
                    if (value && value !== '')
                    {
                        return `${getRequestUrl()}pindouImg/${value}.png`;
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
                data.searchData = data.list.filter((item:any) => 
                {
                    return reg.test(item.data.pindouName) || reg.test(item.data.pindouKey) || reg.test(item.data.desc);
                });
                // data.isloading = true;
                // methods.handleFilter(data.filterValue);
                // if (data.searchData.length === 0)
                // {
                //     proxy.$message.info('未找到搜索内容 QAQ');
                // }
            },
            handleDownload ({ pindouKey, pindouName })
            {
                axios.get(`${getRequestUrl()}pindou/${pindouKey}.json`)
                    .then((res) => 
                    {
                        let projectData = res.data;
                        downloadFile(JSON.stringify(projectData), 'application/json', pindouKey);
                    })
                    .catch((err) => 
                    {
                        proxy.$message.error('下载失败 - ' + err);
                        console.error(err);
                    });
            },
            handleCurrentChange (e)
            {
                data.currentPage = e;
                methods.getData();
            },
            getData ()
            {
                axios.get(`${getRequestUrl()}json/pindou${data.currentPage}.json`)
                    .then((res) => 
                    {
                        console.log(res.data);
                        data.total = res.data.total;
                        data.list = sortList(res.data.data, 'createAt');
                        data.isloading = false;
                        // methods.handleFilter(data.filterValue);
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
                // if (!d.length) 
                // {
                //     // d = arr;
                //     // proxy.$message.info('未找到相关内容 QAQ');
                // }
                return d;
            },
            filterData2 (arr, value)
            {
                let reg = new RegExp(data.searchValue, 'i');
                let d = arr.filter((item:any) => 
                {
                    if (data.searchValue !== '')
                    {
                        return (reg.test(item.data.projectName) || reg.test(item.data.desc)) && (item.data.tag.includes(value));
                    }
                    return item.data.tag.includes(value);
                });
                return d;
            },
            handleFilter (e)
            {
                data.isloading = true;
                if (data.filterValue.length <= 0)
                {
                    data.filterValue = [0];
                }
                if (data.filterValue.length > 1)
                {
                    if (data.filterValue[data.filterValue.length - 1] === 0)
                    {
                        data.filterValue = [0];
                    }
                    else
                    {
                        let index = data.filterValue.findIndex((v) => v === 0);
                        if (index >= 0)
                        {
                            data.filterValue.splice(index, 1);
                        }
                    }
                }
                data.searchData = [];
                if (data.filterValue.includes(0))
                {
                    data.searchData = [...data.searchData, ...methods.filterData(data.list, 70 * 70, 6 * 6)];
                }
                if (data.filterValue.includes(1))
                {
                    data.searchData =  [...data.searchData, ...methods.filterData(data.list, 20 * 20, 6 * 6)];
                }
                if (data.filterValue.includes(2))
                {
                    data.searchData =  [...data.searchData, ...methods.filterData(data.list, 40 * 40, 20 * 20)];
                }
                if (data.filterValue.includes(3))
                {
                    data.searchData = [...data.searchData, ...methods.filterData(data.list, 70 * 70, 40 * 40)];
                }
                if (data.filterValue.includes(4))
                {
                    let arr = methods.filterData2(data.list, 1);
                    arr.forEach((item) => 
                    {
                        if (!data.searchData.find((value) => value.id === item.id))
                        {
                            data.searchData.push(item);
                        }
                    });
                }
                if (data.filterValue.includes(5))
                {
                    let arr = methods.filterData2(data.list, 0);
                    arr.forEach((item) => 
                    {
                        if (!data.searchData.find((value) => value.id === item.id))
                        {
                            data.searchData.push(item);
                        }
                    });
                }
                data.isloading = false;
            },
            handleReset ()
            {
                data.searchValue = '';
                // data.filterValue = [0];
                // methods.handleFilter(data.filterValue);
            },
            handleImport ({ pindouKey, pindouName })
            {
                // 导入到我的拼豆
                axios.get(`${getRequestUrl()}pindou/${pindouKey}.json`)
                    .then((res) => 
                    {
                        let jsonData = res.data;
                        editSpaceStore.savePindouData(
                            {
                                id:pindouKey, 
                                value:{
                                    data:jsonData,
                                    label:pindouName
                                }
                            }).then((res1) => 
                        {
                            if (res1) 
                            {
                                let arr = Object.keys(editSpaceStore.pindouMaps).map((key) => 
                                {
                                    return {
                                        value:key,
                                        label:editSpaceStore.pindouMaps[key].label
                                    };
                                });
                                proxy.$utils.cache.pindou.set(JSON.stringify(arr));
                                proxy.$message.success(proxy.$t('message.importSucceeded'));
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