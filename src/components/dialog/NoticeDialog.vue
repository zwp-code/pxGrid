<template>
    <el-dialog 
    v-model="dialogVisible"
    :width="400"
    :before-close="handleClose"
    :lock-scroll="false"
    :show-close="false"
    :close-on-click-modal="!checkIsForceUpdate"
    :close-on-press-escape="!checkIsForceUpdate"
    class="z-dialog" center>
        <template #header="{ titleId, titleClass }">
            <div class="flex-between">
                <h4 :id="titleId" :class="titleClass" draggable="false">{{notice.title}}</h4>
                <div class="flex-end" v-if="!checkIsForceUpdate">
                    <el-icon class="pointer" @click="handleClose" title="关闭"><Close /></el-icon>
                </div>
            </div>
        </template>
        <div class="notice-content" v-html="notice.content"></div>
        <template #footer v-if="!checkIsForceUpdate">
            <span class="dialog-footer">
                <el-button type="primary" @click="handleHidden" class="full-w">不再提示</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance, computed } from 'vue';
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
        const checkIsForceUpdate = computed(() => 
        {
            if (props.notice.isForceUpdate === '0') return false;
            return true;
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
            ...methods,
            checkIsForceUpdate
        };
    }
});
</script>
<style lang='scss' scoped>
.notice-content {
    padding: 0px 2px;
    font-size: 15px;
    text-align: justify;
    white-space: pre-wrap;
    line-height:2;
}
</style>
