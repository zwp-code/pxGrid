<template>
    <el-dialog v-model="dialogVisible" title="我的颜色"
    :width="500"
    :before-close="handleClose"
    class="z-dialog" center>
        <div class="notice-content">

        </div>
        <!-- <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="handleClose"
                >{{ $t('message.close') }}</el-button>
            </span>
        </template> -->
    </el-dialog>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
export default defineComponent({
    name: 'MyColorDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        let data = reactive({
            dialogVisible:props.visible,
            list:[]
        });
        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
            },
            getData ()
            {
                //
            }
        };

        onMounted(() => 
        {
            methods.getData();
        });
        return {
            ...toRefs(data),
            ...methods
        };
    }
});
</script>
<style lang='scss' scoped>
.notice-content {
    padding: 5px 5px 15px;
    font-size: 15px;
    text-align: justify;
}
</style>
