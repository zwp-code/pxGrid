<template>
    <el-dialog v-model="dialogVisible" :title="$t('message.export')"
    :width="500"
    :lock-scroll="false"
    :before-close="handleClose"
    class="z-dialog" center>
        <div class="content">
            <div class="file">
                <p>文件名称</p>
                <el-input v-model="fileName" placeholder="请输入文件名称" />
            </div>
            <template v-if="!isExportProject">
                <div>
                    <el-checkbox v-model="checked1" label="精灵图（不区分图层）" :disabled="options.isShowGrid" @change="handleChange($evnet, 1)"/>
                    <el-checkbox v-model="checked2" label="精灵图（区分图层）" :disabled="options.isShowGrid" @change="handleChange($evnet, 2)"/>
                </div>
                <div>
                    <el-checkbox v-model="checked3" label="单张图（不区分图层）" @change="handleChange($evnet, 3)"/>
                    <el-checkbox v-model="checked4" label="单张图（区分图层）" @change="handleChange($evnet, 4)"/>
                </div>
                <div>
                    <el-checkbox v-model="checked5" label="GIF动图（不区分图层）" :disabled="options.isShowGrid" @change="handleChange($evnet, 5)"/>
                    <el-checkbox v-model="checked6" label="GIF动图（区分图层）" :disabled="options.isShowGrid" @change="handleChange($evnet, 6)"/>
                </div>
                <div class="flex-start" style="gap:10px" v-if="!options.isShowGrid && (checked5 || checked6)">
                    <p>速率</p>
                    <div>
                        <el-radio-group v-model="gifSpeed" :disabled="options.isShowGrid">
                            <el-radio :value="0.2">0.2s</el-radio>
                            <el-radio :value="0.4">0.4s</el-radio>
                            <el-radio :value="0.5">0.5s</el-radio>
                        </el-radio-group>
                    </div>
                    <el-input-number
                    v-model="gifSpeed"
                    style="max-width: 110px"
                    size="small"
                    :step="0.1"
                    :max="1"
                    :min="0.1"
                    >
                        <template #suffix>
                            <span>秒</span>
                        </template>
                    </el-input-number>
                </div>
                <div class="flex-start" style="gap:10px" v-if="!options.isShowGrid">
                    <p>倍图</p>
                    <div>
                        <el-radio-group v-model="radio" :disabled="options.isShowGrid">
                            <el-radio :value="1">x1</el-radio>
                            <el-radio :value="2">x2</el-radio>
                            <el-radio :value="3">x3</el-radio>
                            <el-radio :value="4">x4</el-radio>
                            <el-radio :value="5">x5</el-radio>
                        </el-radio-group>
                    </div>
                    <el-input-number
                    v-model="radio"
                    style="max-width: 110px"
                    size="small"
                    :step="1"
                    :max="10"
                    :min="1"
                    >
                        <template #prefix>
                            <span>x</span>
                        </template>
                    </el-input-number>
                </div>
                <div class="flex-start" style="gap:10px">
                    <p>样式</p>
                    <div class="flex-start" style="gap:10px">
                        <el-checkbox v-model="options.isShowGrid" label="网格图" @change="handleChangeGrid"/>
                        <div class="flex-start" style="gap:10px;height: 32px;" v-if="options.isShowGrid">
                            <el-color-picker v-model="options.gridBackgroundColor" show-alpha size="small"/>
                            <span style="line-height:1;">网格背景色</span>
                        </div>
                    </div>
                </div>
            </template>
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
            checked5:false,
            checked6:false,
            type:1,
            radio:1,
            options:{
                isShowGrid:false,
                gridBackgroundColor:'#ffffffff'
            },
            gifSpeed:0.2
            
        });
        let methods = {
            handleChangeGrid ()
            {
                if (data.options.isShowGrid)
                {
                    if ([1, 2, 5, 6].includes(data.type)) 
                    {
                        data.options.isShowGrid = false;
                        return proxy.$message.warning('网格图仅支持导出单张图');
                    }
                }
            },
            clearStatus ()
            {
                for (let i = 0; i < 6; i++)
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
                context.emit('export', data.type, data.fileName, data.radio, false, data.options, data.gifSpeed * 10);
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

    .el-radio {
        margin-right: 15px;
    }

    :deep(.el-input-group__prepend) {
        padding: 0 10px;
    }
}
</style>
