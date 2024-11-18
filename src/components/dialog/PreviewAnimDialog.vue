<template>
    <el-dialog v-model="dialogVisible" 
    title="动画预览"
    :width="600"
    :before-close="handleClose"
    @open="initSpirit"
    :lock-scroll="false"
    class="z-dialog" center>
        <div class="content flex-column-center">
            <canvas id="Preview" width="512" height="512"></canvas>
            <div class="flex-between full-w">
                <span style="flex: 1;">帧率</span>
                <el-slider v-model="frameRate" :step="10" show-stops :min="10" :max="60" style="flex:75%" @change="startAnimation"/>
            </div>
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
            frameId:null as any,
            frameRate:60
        });
        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                cancelAnimationFrame(data.frameId);
                if (data.spirit)
                {
                    data.spirit.animate = false;
                }
            },
            handleOpen (value)
            {
                data.dialogVisible = true;
                data.imgData.imgUrl = value.imgUrl;
                console.log(value.imgUrl);
                
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
                
                methods.startAnimation();
                
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
            },

            startAnimation () 
            {
                if (data.frameId) cancelAnimationFrame(data.frameId);
                const interval = 1000 / data.frameRate; // 每帧需要的时间间隔（毫秒）
                let lastTime = 0; // 上一次动画帧的时间戳

                function animate (currentTime) 
                {
                    // 计算当前帧与上一帧的时间差
                    const deltaTime = currentTime - lastTime;

                    if (deltaTime >= interval) 
                    {
                        lastTime = currentTime; // 更新上一次动画帧的时间戳

                        // 执行动画逻辑
                        data.ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);
                        data.spirit.draw();
                        data.spirit.animate = true;
                    }

                    data.frameId = requestAnimationFrame(animate); // 请求下一帧
                }

                // 启动动画循环
                data.frameId = requestAnimationFrame(animate);
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
    padding:20px;
}
</style>
