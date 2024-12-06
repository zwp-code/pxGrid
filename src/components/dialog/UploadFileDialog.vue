<template>
    <el-dialog 
    v-model="dialogVisible" 
    title="导入项目"
    :before-close="handleClose"
    :lock-scroll="false"
    class="z-dialog" center :width="500">
        <el-upload
        ref="uploadRef"
        class="flex-column-center"
        drag
        multiple
        :auto-upload="false"
        accept=".json"
        :on-change="handleChange"
        v-model:file-list="fileList"
        >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
                拖拽文件到这 或者
                <em>点击这里上传</em>
            </div>
            <template #tip>
                <div class="el-upload__tip">
                    需要上传 .json为后缀的项目文件（并非图片文件！）
                </div>
            </template>
        </el-upload>
           
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">{{ $t('message.cancel') }}</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="loading"
                >{{ $t('message.confirm') }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { getCurrentInstance, onMounted, reactive, ref, toRefs, defineComponent } from 'vue';

export default defineComponent({
    name: 'UploadFileDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'reload'],
    setup (props, context) 
    {
        const { proxy }:any = getCurrentInstance();
        
        let data = reactive({
            loading:false,
            dialogVisible:props.visible,
            fileList:[] as any,
            fileListTemp:[] as any,
            imageTypes: [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/bmp',
                'image/svg+xml'
            ]
        });


        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
            },
            handleConfirm ()
            {
                console.log(data.fileList);
                if (!data.fileList.length) return proxy.$message.warning('上传文件不能为空');
                context.emit('close');
                context.emit('reload', data.fileList);
            },
            handleChange (uploadFile, uploadFiles)
            {
                data.fileList = uploadFiles;
                if (uploadFile.raw.type !== 'application/json') 
                {
                    let index = data.fileList.findIndex((file) => file.uid === uploadFile.uid);
                    data.fileList.splice(index, 1);
                    
                    proxy.$message.warning('导入文件格式不正确，确保导入的是.json项目文件而非其他文件');
                }
                // if (data.fileListTemp && data.fileListTemp.length > 0)
                // {
                //     data.fileListTemp.forEach((item, index) => 
                //     {
                //         if (item.name === uploadFile.name && item.size === uploadFile.size)
                //         {
                //             data.fileListTemp.splice(index, 1);
                //             data.fileList.splice(index, 1);
                //             proxy.$message.warning('上传文件重复');

                //         }
                //     });
                // }
                // data.fileListTemp = JSON.parse(JSON.stringify(uploadFiles));
                
            }
        };

        // onMounted(() => 
        // {
            
        // });

        return {
            ...toRefs(data),
            ...methods
        };
    }
});

</script>
<style lang='scss' scoped>
:deep(.el-upload-list) {
    width: 100%;
}

:deep(.el-upload.is-drag) {
    width: 100%;
}
</style>
