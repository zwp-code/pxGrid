<template>
    <el-dialog v-model="dialogVisible" :title="$t('message.export')"
    :width="500"
    :before-close="handleClose"
    class="z-dialog" center>
        <div class="content">
            <div class="file">
                <p>文件名称</p>
                <el-input v-model="fileName" placeholder="请输入文件名称" />
            </div>
            <div v-if="!isExportProject">
                <el-checkbox v-model="checked1" label="精灵图（不区分图层）" @change="handleChange($evnet, 1)"/>
                <el-checkbox v-model="checked2" label="精灵图（区分图层）" @change="handleChange($evnet, 2)"/>
            </div>
            <div v-if="!isExportProject">
                <el-checkbox v-model="checked3" label="单张图（不区分图层）" @change="handleChange($evnet, 3)"/>
                <el-checkbox v-model="checked4" label="单张图（区分图层）" @change="handleChange($evnet, 4)"/>
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
    name: 'ExportDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        },
        loading:{
            type:Boolean,
            default:false
        },
        isExportProject:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'export'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:props.visible,
            fileName:editSpaceStore.getCurrentProjectNameById(),
            checked1:true,
            checked2:false,
            checked3:false,
            checked4:false,
            type:1
        });
        let methods = {
            clearStatus ()
            {
                for (let i = 0; i < 4; i++)
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
                context.emit('close');
            },
            handleConfirm ()
            {
                if (data.fileName.trim() === '') return proxy.$message.warning('请输入文件名称');
                context.emit('export', data.type, data.fileName);
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

    .file {
        margin: 10px 0;

        p {
            margin: 10px 0;
        }
    }
}
</style>
