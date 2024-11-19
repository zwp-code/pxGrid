import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed } from 'vue';
import HomeFooter from '@/components/HomeFooter.vue';
import axios from 'axios';
export default defineComponent({
    name:'about',
    components: {
        HomeFooter
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        let data = reactive({
            updates:[
                
            ],
            links:[
                
            ],
            donates:[
                
            ]
        });
     
       
        let methods = {
            handleOpen (url)
            {
                window.open(url, '_blank');
            },
            getDonateData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/donate.json`)
                    .then((res) => 
                    {
                        data.donates = res.data;

                    })
                    .catch((err) => 
                    {
                        console.error(err);
                    });
            },
            getUpdateData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/update.json`)
                    .then((res) => 
                    {
                        if (res.data.length)
                        {
                            data.updates = res.data.reverse();
                        }

                    })
                    .catch((err) => 
                    {
                        console.error(err);
                    });
            },
            getLinkData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/link.json`)
                    .then((res) => 
                    {
                        data.links = res.data;

                    })
                    .catch((err) => 
                    {
                        console.error(err);
                    });
            }
        };
        
        onMounted(() => 
        {
            methods.getDonateData();
            methods.getUpdateData();
            methods.getLinkData();
        });

        return {
            ...toRefs(data),
            ...methods
        };
    }
});