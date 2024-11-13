<template>
    <el-dialog v-model="dialogVisible" :title="notice.title"
    :width="500"
    :before-close="handleClose"
    :lock-scroll="false"
    class="z-dialog" center>
        <div class="notice-content">{{notice.content}}</div>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="handleHidden"
                >不再提示</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
export default defineComponent({
    name: 'NoticeDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        },
        notice:{
            type:Object,
            default:null
        }
    },
    emits: ['close'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        let data = reactive({
            dialogVisible:props.visible
        });
        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
                proxy.$utils.cache.isHideNotice.set('0');
            },
            handleHidden ()
            {
                methods.handleClose();
                proxy.$utils.cache.isHideNotice.set(props.notice.id);
            }
        };

        onMounted(() => 
        {
            // methods.getData();
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
    white-space: pre-wrap;
    line-height:2;
}
</style>
