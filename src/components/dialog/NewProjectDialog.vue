<template>
    <el-dialog v-model="dialogVisible" :title="editInfo ? $t('message.editProject') : $t('message.newProject')"
    :width="500"
    :before-close="handleClose"
    class="z-dialog" center>
        <el-form
            ref="form"
            label-position="top"
            label-width="100px"
            :show-message="false"
            :model="itemInfo">
                <el-form-item label="项目名称" required prop="projectName">
                    <el-input v-model="itemInfo.projectName" clearable placeholder="请输入"/>
                </el-form-item>
                <el-form-item label="画布像素" required v-if="!editInfo">
                    <div class="flex-start full-w">
                        <el-input
                        v-model="itemInfo.width"
                        type="number"
                        :max="70"
                        :min="6"
                        @change="(e) => handleChangeCanvasSize(e, 'width')"
                        >
                            <template #prepend>宽</template>
                        </el-input>
                        <el-input
                        v-model="itemInfo.height"
                        style="margin-left: 10px;"
                        type="number"
                        :max="70"
                        :min="6"
                        @change="(e) => handleChangeCanvasSize(e, 'height')"
                        >
                            <template #prepend>高</template>
                        </el-input>
                    </div>
                </el-form-item>
                <el-form-item label="项目描述" required prop="desc">
                    <el-input 
                    v-model="itemInfo.desc"
                    placeholder="请输入"
                    type="textarea"
                    maxlength="30"
                    show-word-limit
                    :autosize="{ minRows: 1, maxRows: 3 }"/>
                </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">{{ $t('message.cancel') }}</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="isloading"
                >{{ $t('message.confirm') }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { formatTime } from '@/utils/utils';
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
import { useEditSpaceStore } from '@/store';
import Worker from '@/utils/worker.js?worker';
import useDB from '@/hooks/useDB';
import { uuid } from 'vue-uuid';
export default defineComponent({
    name: 'NewProjectDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        },
        editInfo:{
            type:Object,
            default:null
        }
    },
    emits: ['close', 'save'],
    setup (props, context) 
    {
        const editSpaceStore = useEditSpaceStore();
        const useDBHooks = useDB();
        let { proxy }:any = getCurrentInstance();
        let data = reactive({
            dialogVisible:props.visible,
            itemInfo:{
                projectName:'',
                desc:'',
                createAt:'',
                updateAt:'',
                projectId:'',
                width:32,
                height:32,
                frameImg:'',
                isTop:0,
                tip:'新项目',
                data:null
            } as any,
            isloading:false
        });
        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
            },
            handleChangeCanvasSize (e, key)
            {
                if (e < 6 || e > 70) 
                {
                    data.itemInfo[key] = e < 6 ? 6 : e > 70 ? 70 : data.itemInfo[key];
                    proxy.$message.warning('画布像素不能小于6或大于70像素');
                }
                // data[key] = Number(e);
                // if (data.isCheckedRatio)
                // {
                //     // 如果选择了保持横纵比
                //     if (key === 'canvasWidth')
                //     {
                //         data.canvasHeight = parseInt(data[key] / data.widthHeightRatio);
                //     }
                //     else
                //     {
                //         data.canvasWidth = parseInt(data[key] / data.widthHeightRatio);
                //     }
                // }
            },
            handleConfirm ()
            {
                proxy.$refs['form'].validate((valid) => 
                {
                    if (valid)
                    {
                        // 缓存项目
                        data.isloading = true;
                        if (props.editInfo)
                        {
                            data.itemInfo.updateAt = formatTime();
                            data.itemInfo.tip = '最近编辑';
                            editSpaceStore.saveProject(data.itemInfo).then((res) => 
                            {
                                if (res) 
                                {
                                    data.isloading = false;
                                    // context.emit('save');
                                    methods.handleClose();
                                    proxy.$message.success(proxy.$t('message.saveSucceeded'));
                                }
                            }).catch((err) => 
                            {
                                console.log(err);
                                data.isloading = false;
                                proxy.$message.error(proxy.$t('message.saveFailed'));
                            });
                            return;
                        }
                        data.itemInfo.projectId = uuid.v1();
                        data.itemInfo.createAt = formatTime();
                        data.itemInfo.updateAt = data.itemInfo.createAt;
                        editSpaceStore.saveProject(data.itemInfo).then((res) => 
                        {
                            if (res) 
                            {
                                proxy.$message.success(proxy.$t('message.saveSucceeded'));
                                data.isloading = false;
                                methods.handleClose();
                                proxy.$router.push({
                                    name:'work',
                                    params:{
                                        projectId:data.itemInfo.projectId
                                    }
                                });
                                // editSpaceStore.saveProjectId(data.itemInfo.projectId);
                            }
                        }).catch((err) => 
                        {
                            console.log(err);
                            proxy.$message.error(proxy.$t('message.saveFailed'));
                            data.isloading = false;
                        });
                        
                    }
                    else 
                    {
                        proxy.$message.warning('请填写参数');
                    }
                });
            }
        };

        onMounted(() => 
        {
            if (props.editInfo)
            {
                // 获取编辑数据
                data.itemInfo = props.editInfo;
            }
        });
        return {
            ...toRefs(data),
            ...methods
        };
    }
});
</script>
<style lang='scss' scoped>
@keyframes AnimationShow {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
