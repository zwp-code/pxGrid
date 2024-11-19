import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, watchEffect } from 'vue';
import { useEditSpaceStore } from '@/store';
export default defineComponent({
    name:'feedback',
    components: {

    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            isloading:true,
            name:'兔小巢',
            link:'https://txc.qq.com/products/676521'
        });

       
        let methods = {
            iframeLoad ()
            {
                data.isloading = false;
            }
        };
        
        onMounted(() => 
        {
            //
        });

        return {
            ...toRefs(data),
            ...methods
        };
    }
});