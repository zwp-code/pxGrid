<template>
    <el-dialog v-model="dialogVisible" title="替换颜色"
    :width="300"
    draggable="true"
    :modal="false"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="z-dialog z-dialog-1" center>
        <div class="content">
            <div class="color flex-start">
                <p>替换颜色</p>
                <el-color-picker v-model="replaceColor" show-alpha @active-change="(e) => replaceColor = e"/>
            </div>
            <div class="color flex-start">
                <p>新颜色</p>
                <el-color-picker v-model="newColor" show-alpha @active-change="(e) => newColor = e"/>
            </div>
            <div>
                <el-checkbox v-model="checked1" label="当前图层" @change="handleChange($evnet, 1)"/>
                <el-checkbox v-model="checked2" label="所有图层" @change="handleChange($evnet, 2)"/>
            </div>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button  @click="handleClose"
                >{{ $t('message.cancel') }}</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="loading"
                >{{ $t('message.confirm') }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { useEditSpaceStore } from '@/store';
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
export default defineComponent({
    name: 'ReplaceColorDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'confirm'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:false,
            replaceColor:'#000000ff',
            newColor:'',
            checked1:true,
            checked2:false,
            type:1,
            loading:false
        });
        let methods = {
            clearStatus ()
            {
                for (let i = 0; i < 2; i++)
                {
                    data[`checked${i + 1}`] = false;
                }
            },
            handleChange (e, type)
            {
                // if (data[`check${type}`]) data[`check${type}`] = !data[`check${type}`];
                methods.clearStatus();
                data[`checked${type}`] = true;
                data.type = type;
            },
            handleClose ()
            {
                data.dialogVisible = false;
                data.replaceColor = '#000000ff';
                data.newColor = '';
                methods.handleChange('', 1);
                context.emit('close');
            },
            handleOpen ()
            {
                data.dialogVisible = true;
            },
            handleConfirm ()
            {
                if (data.replaceColor.trim() === '' || data.newColor.trim() === '') return proxy.$message.warning('颜色不能为空');
                data.loading = true;
                context.emit('confirm', { type:data.type, replaceColor:data.replaceColor, newColor:data.newColor }, () => data.loading = false);
            },
            handleUpdate (color)
            {
                console.log(color);
                
                data.replaceColor = color;
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
.content {
    padding:10px;

    .color {
        margin: 10px 0;

        p {
            margin: 10px 20px 10px 0;
        }
    }
}
</style>
