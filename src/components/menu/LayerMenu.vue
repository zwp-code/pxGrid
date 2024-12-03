<template>
    <ul
    id="app-contextMenu"
    v-if="visible" 
    :style="{left:newLeft+'px',top:newTop+'px'}" 
    class="contextmenu">
        <li class="flex-between" @click="handleImport">
            <span>导入图像</span>
            <el-icon><Picture /></el-icon>
        </li>
        <li class="flex-between" @click="handleExport">
            <span>导出图像</span>
            <el-icon><Camera /></el-icon>
        </li>
        <li class="flex-between" @click="handleCopy">
            <span>复制数据</span>
            <el-icon><DocumentCopy /></el-icon>
        </li>
        <li class="flex-between" @click="handlePaste">
            <span>粘贴数据</span>
            <el-icon><Document /></el-icon>
        </li>
    </ul>
</template>

<script lang='ts'>
import { reactive, toRefs, getCurrentInstance, onMounted, computed } from 'vue';
export default {
    name:'LayerMenu',
    props: {
        visible:{
            type:Boolean,
            default:false
        },
        left:{
            type:Number,
            default:0
        },
        top:{
            type:Number,
            default:0
        },
        contextData:{
            type:Object,
            default:null
        }
    },
    components: {

    },
    emits:['import', 'export', 'copy', 'paste'],
    setup (props, context) 
    {
        const { proxy }:any = getCurrentInstance();
        let data = reactive({
            timer:null as any,
            newTop:props.top,
            newLeft:props.left
        });

        let methods = {
            handleImport ()
            {
                context.emit('import');
            },
            handleExport ()
            {
                context.emit('export');
            },
            handleCopy ()
            {
                context.emit('copy');
            },
            handlePaste ()
            {
                context.emit('paste');
            }

        };
        onMounted(() => 
        {
            let bodyHeight = document.body.offsetHeight;
            let bodyWidth = document.body.offsetWidth;
            let menu = document.querySelector('#app-contextMenu') as HTMLDivElement;
            if (props.top +  menu.offsetHeight > bodyHeight)
            {
                data.newTop = bodyHeight - menu.offsetHeight;
            }
            else if (props.left + menu.offsetWidth > bodyWidth)
            {
                data.newLeft = (bodyWidth - 70) - menu.offsetWidth;
            }
        });
        
        return { 
            ...toRefs(data),
            ...methods
        };
    }
};
</script>

<style scoped lang="scss">
.contextmenu {
    z-index: 2005;
    li {
        margin: 2px 4px;
        padding: 7px 10px;
        border-radius: 6px;
        transition: all .1s;

        span {
            margin-right: 20px;
        }
    }
}

</style>
