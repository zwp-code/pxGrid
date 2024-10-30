import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed } from 'vue';
import { Download } from '@element-plus/icons-vue';
import axios from 'axios';
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
            moduleList:[]
        });

        let methods = {
            handleOpen (obj)
            {
                let url = '';
                if (proxy.$utils.cache.lang.get() === 'zh')
                {
                    url = obj.zh;
                }
                else
                {
                    url = obj.en;
                }
                window.open(url, '_blank');
            },
            getData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/module.json`)
                    .then((res) => 
                    {
                        data.moduleList = res.data;

                    })
                    .catch((err) => 
                    {
                        proxy.$message.error(err);
                        console.error(err);
                    });
            }
        };
        
        onMounted(() => 
        {
            methods.getData();
            
        });

        return {
            ...toRefs(data),
            ...methods,
            Download
        };
    }
});