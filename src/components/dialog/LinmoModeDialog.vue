<template>
    <el-dialog 
    v-model="dialogVisible"
    :width="300"
    draggable="true"
    :modal="false"
    :lock-scroll="false"
    :close-on-click-modal="false"
    :show-close="false"
    :before-close="handleClose"
    class="z-dialog z-dialog-1" center>
        <template #header="{ titleId, titleClass }">
            <div class="flex-between">
                <h4 :id="titleId" :class="titleClass" draggable="false">{{`临摹模式`}}</h4>
                <div class="flex-end">
                    <el-icon class="pointer" @click="handleHide" style="margin-right:15px" title="最小化"><Minus /></el-icon>
                    <el-icon class="pointer" @click="handleClose" title="关闭"><Close /></el-icon>
                </div>
            </div>
        </template>
        <div class="content">
            <div class="item flex-between">
                <p>临摹图片</p>
                <el-link type="primary" :underline="false" @click="handleUpload">上传图片</el-link>
            </div>
            <div class="item flex-between">
                <p>缩放x</p>
                <el-input-number v-model="zoomX" :min="0.1" :max="100" size="small" :step="0.1" @change="updatelinmoPhotoStyle"/>
            </div>
            <div class="item flex-between">
                <p>缩放y</p>
                <el-input-number v-model="zoomY" :min="0.1" :max="100" size="small" :step="0.1" @change="updatelinmoPhotoStyle"/>
            </div>
            <div class="item flex-between">
                <p>位置x</p>
                <el-input-number v-model="posX" :min="-999" :max="9999" size="small" :step="5" @change="updatelinmoPhotoStyle"/>
            </div>

            <div class="item flex-between">
                <p>位置y</p>
                <el-input-number v-model="posY" :min="-999" :max="9999" size="small" :step="5" @change="updatelinmoPhotoStyle"/>
            </div>
            <div class="item flex-between">
                <p>透明度</p>
                <el-input-number v-model="opacity" :min="0" :max="100" size="small" @change="updatelinmoPhotoStyle"/>
            </div>
            <div class="item flex-between">
                <p>旋转角度</p>
                <el-input-number v-model="rotate" :min="0" :max="360" size="small" @change="updatelinmoPhotoStyle"/>
            </div>
            <div class="item flex-between">
                <p>置于顶层</p>
                <el-checkbox v-model="zIndex" label="" @change="updatelinmoPhotoStyle" size="small"/>
            </div>
            <div class="item flex-between">
                <p>图片隐藏</p>
                <el-checkbox v-model="display" label="" @change="updatelinmoPhotoStyle" size="small"/>
            
            </div>
            <div class="item flex-between">
                <p>取色器</p>
                <EyeDropper @colorPicked="handleColorPicked" class="pick-color" :style="{
                    backgroundColor:pickedColor
                }"/>
            </div>
        </div>
    </el-dialog>
    <!-- <teleport to="body">
        <img :src="photo" v-if="photo" :style="linmoPhotoStyle" class="linmoPhoto"/>
    </teleport> -->
</template>

<script lang="ts">
import { useEditSpaceStore } from '@/store';
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
import { EyeDropper } from 'vue-eye-dropper';
export default defineComponent({
    name: 'LinmoModeDialog',
    components: {
        EyeDropper
    },
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'hide', 'update', 'upload', 'color'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:false,
            zoomX:1,
            zoomY:1,
            opacity:100,
            posX:0,
            posY:0,
            rotate:0,
            zIndex:false,
            display:false,
            linmoPhotoStyle:{
                transform: 'translate(0px, 0px) rotate(0deg) scale(1, 1)',
                opacity:1,
                zIndex:0,
                display:'block'
            },
            pickedColor:'#00000000'

        });
        
        let methods = {
            handleUpload ()
            {
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png,image/jpeg';
                input.addEventListener('change', function () 
                {
                    const file = input.files[0];
                    if (file) 
                    {
                        const reader = new FileReader();
                        reader.onload = function (e) 
                        {
                            console.log(e);
                            context.emit('upload', e.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                });
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            },
            handleShow ()
            {
                data.dialogVisible = true;
            },
            handleHide ()
            {
                context.emit('hide');
                data.dialogVisible = false;
            },
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close', 'linmoMode');
                context.emit('update', {
                    transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
                    opacity:1,
                    zIndex:0,
                    display:'block'
                });
                context.emit('upload', null);
            },
            handleOpen ()
            {
                if (!data.dialogVisible)
                {
                    data.dialogVisible = true;
                    data.zoom = 1;
                    data.opacity = 100;
                    data.posX = 0;
                    data.posY = 0;
                    data.rotate = 0;
                    data.zIndex = false;
                    data.display = false;
                    data.pickedColor = '#00000000';
                }
            },
            updatelinmoPhotoStyle () 
            {
                // 根据当前的变换值更新linmoPhotoStyle对象
                data.linmoPhotoStyle.transform = `translate(${data.posX}px, ${data.posY}px) rotate(${data.rotate}deg) scale(${data.zoomX}, ${data.zoomY})`;
                data.linmoPhotoStyle.opacity = data.opacity / 100;
                data.linmoPhotoStyle.zIndex = data.zIndex ? 1 : 0;
                data.linmoPhotoStyle.display = data.display ? 'none' : 'block';
                context.emit('update', data.linmoPhotoStyle);

            },
            handleColorPicked (color)
            {
                console.log(color);
                data.pickedColor = color;
                context.emit('color', color);
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
</script>
<style lang='scss' scoped>
.content {
    // padding:10px;
    max-height: 500px;
    overflow: auto;

    .item {
        margin: 8px 0;
        // gap:15px;

        p {
            margin: 5px 0 5px 2px;
        }
    }

    .pick-color {
        border: none;
        border-radius: 3px;
        width: 20px;
        height: 20px;
        box-shadow: 0px 0px 4px 2px var(--el-shadow-color);
        cursor: pointer;
        margin-right: 5px;
    }

}
</style>
