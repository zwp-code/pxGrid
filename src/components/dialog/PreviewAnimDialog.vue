<template>
    <el-dialog v-model="dialogVisible" 
    title="动画预览"
    :width="600"
    :before-close="handleClose"
    @open="initSpirit"
    class="z-dialog" center>
        <div class="content flex-center">
            <canvas id="Preview" width="512" height="512"></canvas>
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
import Spirit from '@/utils/Spirit';
export default defineComponent({
    name: 'PreviewAnimDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        },
        imgSrc:{
            type:String,
            default:''
        }
    },
    emits: ['close'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        let data = reactive({
            dialogVisible:false,
            canvas:null as any,
            ctx:null as any,
            scale:1,
            imgData:{
                imgUrl:'',
                width:0,
                height:0,
                frame:1
            },
            spirit:null as any,
            frameId:null as any
        });
        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                cancelAnimationFrame(data.frameId);
                data.spirit.animate = false;
            },
            handleOpen (value)
            {
                data.dialogVisible = true;
                data.imgData.imgUrl = value.imgUrl;
                data.imgData.width = value.width;
                data.imgData.height = value.height;
                data.imgData.frame = value.frame;
            },
            initSpirit ()
            {
                data.canvas = document.getElementById('Preview');
                data.ctx = data.canvas.getContext('2d');
                // methods.computeScale();
                data.spirit = new Spirit({
                    position: {
                        x: data.canvas.width / 2 - (data.imgData.width) / 2,
                        y: data.canvas.height / 2 - data.imgData.height  / 2
                    },
                    image: data.imgData.imgUrl,
                    scale:1,
                    frames: {
                        max: data.imgData.frame,
                        hold: 10,
                        val: 0
                    },
                    ctx:data.ctx
                });
                console.log(data.spirit);
                
                methods.animate();
                
            },
            computeScale ()
            {
                if (data.imgData.width > data.imgData.height) data.scale = Math.max(1, (data.canvas.width / data.imgData.width / 2));
                else data.scale = Math.max(1, (data.canvas.height / data.imgData.height / 2));
                data.scale = Math.round(data.scale);
                
            },
            animate () 
            {
                data.frameId = requestAnimationFrame(methods.animate);
                data.ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);
                data.spirit.draw();
                data.spirit.animate = true;
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
}
</style>
