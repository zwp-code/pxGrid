<template>
    <el-dialog v-model="dialogVisible" :title="editInfo ? $t('message.editProject') : $t('message.newProject')"
    :width="500"
    :before-close="handleClose"
    :lock-scroll="false"
    class="z-dialog" center>
        <el-form
            ref="form"
            label-position="top"
            label-width="100px"
            :show-message="false"
            :model="itemInfo">
                <el-form-item label="项目名称" required prop="projectName">
                    <el-input v-model="itemInfo.projectName" clearable placeholder="请输入" maxlength="20"/>
                </el-form-item>
                <el-form-item label="画布像素" required v-if="!editInfo">
                    <div class="flex-between full-w">
                        <el-input
                        v-model="itemInfo.width"
                        type="number"
                        :max="72"
                        :min="6"
                        @change="(e) => handleChangeCanvasSize(e, 'width')"
                        >
                            <template #prepend>宽</template>
                        </el-input>
                        <el-input
                        v-model="itemInfo.height"
                        style="margin-left: 10px;"
                        type="number"
                        :max="72"
                        :min="6"
                        @change="(e) => handleChangeCanvasSize(e, 'height')"
                        >
                            <template #prepend>高</template>
                        </el-input>
                        <div style="margin-left: 20px;">
                            <el-checkbox v-model="isCheckedRatio" label="保持横纵比" @change="handleChangeRatio" />
                        </div>
                    </div>
                    <div class="flex-between full-w" style="gap:10px;margin-top:10px">
                        <div v-for="item in canvasTemplate" :key="item.label" class="template-box pointer" 
                        @click="handleSelectTemplate(item)"
                        :class="{'active':selectTemplateId === item.id}">
                            <img :src="require('@/assets/grid-small.png')"/>
                            <div class="full-w size flex-center">
                                <el-tag type="success" size="small" v-if="item.id!==0">{{item.width}}*{{item.height}}</el-tag>
                                <el-tag type="primary" size="small" v-else>自定义</el-tag>
                            </div>
                            
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label="项目描述">
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
            isloading:false,
            isCheckedRatio:true,
            widthHeightRatio:1,
            canvasTemplate:[
                {
                    id:0,
                    width:0,
                    height:0
                },
                {
                    id:1,
                    width:16,
                    height:16
                },
                {
                    id:2,
                    width:24,
                    height:24
                },
                {
                    id:3,
                    width:32,
                    height:32
                },
                {
                    id:4,
                    width:48,
                    height:48
                },
                {
                    id:5,
                    width:64,
                    height:64
                }
            ],
            selectTemplateId:3
        });
        let methods = {
            handleSelectTemplate (value)
            {
                data.selectTemplateId = value.id;
                if (value.id === 0) return;
                data.itemInfo.width = value.width;
                data.itemInfo.height = value.height;
            },
            handleChangeRatio (e)
            {
                if (e)
                {
                    data.widthHeightRatio = data.itemInfo.width / data.itemInfo.height;
                }
            },
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
            },
            handleChangeCanvasSize (e, key)
            {
                if (e < 6 || e > 72) 
                {
                    data.itemInfo[key] = e < 6 ? 6 : e > 72 ? 72 : data.itemInfo[key];
                    proxy.$message.warning('画布像素必须6-70像素区间');
                }
                else
                {
                    data.itemInfo[key] = Number(e);
                }
                if (data.isCheckedRatio)
                {
                    // 如果选择了保持横纵比
                    if (key === 'width')
                    {
                        data.itemInfo.height = parseInt(data.itemInfo[key] / data.widthHeightRatio);
                    }
                    else
                    {
                        data.itemInfo.width = parseInt(data.itemInfo[key] / data.widthHeightRatio);
                    }
                }
                let obj = data.canvasTemplate.find((item) => item.width === data.itemInfo.width && item.height === data.itemInfo.height);
                if (obj)
                {
                    data.selectTemplateId = obj.id;
                }
                else
                {
                    data.selectTemplateId = 0;
                }
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
                                proxy.$message.success(proxy.$t('message.newSucceeded'));
                                data.isloading = false;
                                methods.handleClose();
                                context.emit('save', data.itemInfo);
                                // proxy.$router.push({
                                //     name:'work',
                                //     params:{
                                //         projectId:data.itemInfo.projectId
                                //     }
                                // });
                                // editSpaceStore.saveProjectId(data.itemInfo.projectId);
                            }
                        }).catch((err) => 
                        {
                            console.log(err);
                            proxy.$message.error(proxy.$t('message.newFailed'));
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

.template-box {
    position: relative;
    overflow: hidden;
    border-radius: 5px;
    width: 64px;
    height: 64px;
    border: 2px solid #808080;
    background-color: var(--el-bg-island-nav);

    img {
        object-fit: cover;
        opacity:.6;
    }

    .size {
        position: absolute;
        bottom: 2px;
        right: 30px;
        transform: translate(50%, 0);
    }
}

.active {
    border: 2px solid var(--el-text-color);
}
</style>
