<template>
    <el-dialog 
    v-model="dialogVisible"
    :width="500"
    draggable="true"
    :modal="false"
    :lock-scroll="false"
    :close-on-click-modal="false"
    :show-close="false"
    :before-close="handleClose"
    class="z-dialog z-dialog-1" center>
        <template #header="{ titleId, titleClass }">
            <div class="flex-between">
                <h4 :id="titleId" :class="titleClass" draggable="false">{{`拼豆 - ${isDrawMode ? '绘图模式' : '预览模式'}`}}</h4>
                <div class="flex-end">
                    <el-icon class="pointer" @click="handleHide" style="margin-right:15px" title="最小化"><Minus /></el-icon>
                    <el-icon class="pointer" @click="handleClose" title="关闭"><Close /></el-icon>
                </div>
            </div>
        </template>
        <div class="content scrollbar">
            <el-tag type="info">颜色仅供参考，以实际为准</el-tag>
            <div class="item flex-start">
                <p>拼豆品牌</p>
                <el-select v-model="pindouBrand" @change="handleChangeBrand" placeholder="请选择" style="width:200px">
                    <el-option
                        v-for="item in brandOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <el-button type="success" @click="handleCustomPindou">自定义拼豆</el-button>
            </div>
            <el-tag type="info">拼豆色板引用自：
                <el-link href="https://fusebead.sulian-blog.com/#google_vignette" target="_blank" :underline="false" type="success">fusebead.sulian-blog </el-link>
                作者 - <el-link href="https://github.com/atonasting/fuse-bead-tool" target="_blank" :underline="false" type="primary">苏莉安</el-link></el-tag>
            <div>
                <div class="item flex-start" v-if="selectedObj">
                    <p>当前选择的颜色</p>
                    <div class="flex-center color-item"
                    v-if="selectedObj.name"
                    :style="{backgroundColor:selectedObj.color, color:getFontColor(selectedObj.color)}">
                        {{ selectedObj.name }}
                    </div>
                    <div class="flex-center color-item"
                    style="width:40px; height:30px"
                    v-else
                    :style="{backgroundColor:selectedObj.color, color:getFontColor(selectedObj.color)}">
                    </div>
                </div>
                <div class="item flex-start" style="gap:15px" v-if="selectedObj || isDrawMode">
                    <p>{{ isDrawMode ? '拼豆色卡' : '替换颜色'}}</p>
                    <el-select-v2 
                    v-model="replaceObj" 
                    value-key="name"
                    filterable
                    @change="handleChangeColor"
                    :options="pindouColorList" 
                    placeholder="请搜索色号" 
                    style="width:200px">
                        <!-- <el-option
                            v-for="(item, index) in pindouColorList"
                            :key="index"
                            :label="item.name"
                            :value="item">
                                <span style="float: left">{{ item.name }}</span>
                                <div style="float: right;width: 40px;padding:5px" class="flex-center full-h">
                                    <span 
                                    style="border-radius:5px;box-shadow: 0px 0px 4px 2px var(--el-shadow-color);" 
                                    :style="{backgroundColor:`#${item.color}ff`}" class="full-layout"></span>
                                </div>
                        </el-option> -->
                        <template #default="{ item }">
                            <span style="float: left">{{ item.label }}</span>
                            <div style="float: right;width: 40px;padding:5px" class="flex-center full-h">
                                <span 
                                style="border-radius:5px;box-shadow: 0px 0px 4px 2px var(--el-shadow-color);" 
                                :style="{backgroundColor:`#${item.value.color}ff`}" class="full-layout"></span>
                            </div>
                        </template>
                    </el-select-v2>
                    <div class="flex-center color-item pointer" v-if="replaceObj" style="width:40px; height:30px"
                    @click="copyText('#' + replaceObj.color)"
                    :style="{backgroundColor:'#' + replaceObj.color}">
                    </div>
                </div>
                <div v-if="selectedObj && !isDrawMode" style="gap:15px" class="flex-start">
                    <el-checkbox v-model="checked1" label="单独像素" @change="handleChange($evnet, 1)"/>
                    <el-checkbox v-model="checked2" label="所有像素" @change="handleChange($evnet, 2)"/>
                    <el-checkbox v-model="isHighlight" label="高亮显示" @change="handleHighLight"/>
                </div>
                <div v-if="selectedObj && isDrawMode" style="gap:15px" class="flex-start">
                    <el-checkbox v-model="checked1" label="当前图层" @change="handleChange($evnet, 1)"/>
                    <el-checkbox v-model="checked2" label="所有图层" @change="handleChange($evnet, 2)"/>
                </div>
                <div v-if="!isDrawMode" class="flex-column-start item" style="gap:4px">
                    <div>导出拼豆图纸样式</div>
                    <div class="flex-start" style="gap:15px">
                        <el-checkbox v-model="pindouPicOptions.isShowRulers" label="显示标尺"/>
                        <el-checkbox v-model="pindouPicOptions.isShowGrid" label="显示网格"/>
                        <div class="flex-start" style="gap:10px;height: 32px;" v-if="pindouPicOptions.isShowRulers">
                            <el-color-picker v-model="pindouPicOptions.rulersBackgroundColor" show-alpha size="small"/>
                            <span style="line-height:1;">标尺背景色</span>
                        </div>
                        <div class="flex-start" style="gap:10px;height: 32px;" v-if="pindouPicOptions.isShowRulers">
                            <el-color-picker v-model="pindouPicOptions.rulersColor" show-alpha size="small"/>
                            <span style="line-height:1;">标尺字体色</span>
                        </div>
                    </div>
                    <div class="flex-start" style="gap:15px">
                        <el-checkbox v-model="pindouPicOptions.isShowCirclePoint" label="空白显示小圆点" @change="handlePoint($event, 'isShowCirclePoint')"/>
                        <el-checkbox v-model="pindouPicOptions.isShowRectPoint" label="空白显示小方块"  @change="handlePoint($event, 'isShowRectPoint')"/>
                        <div class="flex-start" style="gap:10px;height: 32px;">
                            <el-color-picker v-model="pindouPicOptions.pointColor" size="small"/>
                            <span style="line-height:1;">显示颜色</span>
                        </div>
                    </div>
                </div>
            </div>
            <el-tag type="info" v-if="isDrawMode">可通过吸管工具选取颜色进行批量替换喔</el-tag>
            <div class="item" v-if="!isDrawMode">
                <el-collapse accordion>
                    <el-collapse-item name="1">
                        <template #title>
                            <div class="flex-between full-w pixelFont">
                                颜色统计
                                <p class="flex-end">数量：{{colorTotal}}</p>
                            </div>
                        </template>
                        <ul class="flex-start flex-warp" style="gap:10px;padding: 5px;">
                            <li 
                            v-for="([key, value], index) in colorStatList"
                            :style="{backgroundColor:value[0]}" 
                            class="color-item-1 flex-center"
                            :key="index">
                                <div class="text-center">{{key}}: {{value[1]}} 个</div>
                            </li>
                        </ul>
                    </el-collapse-item>
                </el-collapse>
            </div>
            
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="success" @click="handleExport" :disabled="loading" v-if="!isDrawMode"
                >导出拼豆图</el-button>
                <el-button type="primary" @click="handleReplace" :loading="loading" v-if="selectedObj"
                >替换颜色</el-button>
            </span>
        </template>
        
    </el-dialog>
    <teleport to="body">
        <CustomPindouDialog ref="CustomPindouDialog" @update="updateData" @close="$emit('addKeyBoard')"></CustomPindouDialog>
    </teleport>
</template>

<script lang="ts">
import { useEditSpaceStore } from '@/store';
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
import pindouMap from '@/config/pindou'; 
import { getFontColor, copyText } from '@/utils/utils'; 
import CustomPindouDialog from '@/components/dialog/CustomPindouDialog.vue';
export default defineComponent({
    name: 'PindouDialog',
    components: {
        CustomPindouDialog
    },
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'replace', 'change', 'export', 'highlight', 'select', 'hide', 'removeKeyBoard', 'addKeyBoard'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:false,
            pindouBrand:'mard',
            brandOptions:[],
            // currentSelectPindou:null as any,
            colorStatList:null as any,
            colorTotal:0,
            pindouColorList:[] as any,
            replaceObj:null as any,
            selectedObj:null as any,
            checked1:true,
            checked2:false,
            type:1,
            loading:false,
            isHighlight:false,
            isDrawMode:false,
            isHide:false,
            pindouPicOptions:{
                isShowRulers:true,
                isShowGrid:false,
                isShowCirclePoint:true,
                isShowRectPoint:false,
                rulersBackgroundColor:'#00000000',
                pointColor:'#000000',
                rulersColor:'#000000'
            }
        });
        
        let methods = {
            handleHighLight ()
            {
                context.emit('highlight', { selectedObj:data.selectedObj, type:data.type, isHighlight:data.isHighlight });
            },
            clearStatus ()
            {
                for (let i = 0; i < 2; i++)
                {
                    data[`checked${i + 1}`] = false;
                }
            },
            handlePoint (e, type)
            {
                if (type === 'isShowCirclePoint' && data.pindouPicOptions[type])
                {
                    data.pindouPicOptions.isShowRectPoint = false;
                }
                else if (type === 'isShowRectPoint' && data.pindouPicOptions[type])
                {
                    data.pindouPicOptions.isShowCirclePoint = false;
                }
            },
            handleChange (e, type)
            {
                // if (data[`check${type}`]) data[`check${type}`] = !data[`check${type}`];
                methods.clearStatus();
                data[`checked${type}`] = true;
                data.type = type;
                if (data.isHighlight) methods.handleHighLight();
            },
            updateData ()
            {
                let pindouOptions = JSON.parse(proxy.$utils.cache.pindou.get());
                data.brandOptions = pindouOptions || [];
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
                data.isHighlight = false;
                // data.pindouBrand = 'mard';
                data.replaceObj = null;
                data.selectedObj = null;
                methods.handleChange('', 1);
                context.emit('close', data.isDrawMode ? 'pinDouDrawMode' : 'pinDouMode');
            },
            handleOpen (value)
            {
                data.dialogVisible = true;
                methods.updateData();
                // data.pindouColorList = editSpaceStore.pindouMaps[data.pindouBrand].data;
                // console.log(data.pindouColorList);
                methods.getPindouColorList();
                if (value === 'draw') return data.isDrawMode = true;
                data.isDrawMode = false;
                data.colorStatList = value.colorStatList;
                data.colorTotal = 0;
                data.colorStatList.forEach((v, k) => 
                {
                    data.colorTotal += v[1];
                });
            },
            handleChangeColor (e)
            {
                console.log(data.replaceObj);
                // console.log(data.pindouColorList);
                // let color = '#' + e.color + 'ff';
                if (data.isDrawMode) 
                {
                    console.log(11111);
                    
                    context.emit('select', e.color);
                }
                // data.replaceObj.color = color.toLowerCase();
            },
            handleExport ()
            {
                // 导出拼豆图
                data.loading = true;
                context.emit('export', () => data.loading = false, { ...data.pindouPicOptions });
            },
            handleReplace ()
            {
                // 替换颜色
                if (!data.replaceObj) return proxy.$message.warning('替换颜色不能为空');
                data.loading = true;
                if (data.isDrawMode)
                {
                    context.emit('replace', { type:data.type, replaceColor:data.selectedObj.color, newColor:'#' + data.replaceObj.color}, () => data.loading = false);
                    return;
                }
                context.emit('replace', { type:data.type, replaceObj:data.replaceObj, originObj:data.selectedObj }, () => data.loading = false);
            },
            handleChangeBrand (e)
            {
                data.replaceObj = null;
                data.selectedObj = null;
                methods.getPindouColorList();
                // if (data.isDrawMode) return data.pindouColorList = editSpaceStore.pindouMaps[data.pindouBrand].data;
                if (!data.isDrawMode) context.emit('change', data.pindouBrand);
            },
            getPindouColorList ()
            {
                let pindouColorList = editSpaceStore.pindouMaps[data.pindouBrand].data;
                data.pindouColorList = pindouColorList.map((item) =>
                {
                    return {
                        value:{
                            name:item.name,
                            color:item.color
                        },
                        label:item.name
                    };
                });
            },
            handleCustomPindou ()
            {
                context.emit('removeKeyBoard');
                proxy.$refs.CustomPindouDialog.handleOpen();
            }
        };

        onMounted(() => 
        {
            methods.updateData();
            // let pindouColorList = editSpaceStore.pindouMaps[data.pindouBrand].data;
            // data.pindouColorList = pindouColorList.map((item) =>
            // {
            //     return {
            //         value:{
            //             name:item.name,
            //             color:item.color
            //         },
            //         label:item.name
            //     };
            // });

        });
        return {
            ...toRefs(data),
            ...methods,
            getFontColor,
            copyText
        };
    }
});
</script>
<style lang='scss' scoped>
.content {
    // padding:10px;
    max-height: 500px;
    overflow: auto;
    
    :deep(.el-tag__content) {
        display: flex;

        a {
            font-size: 12px;
            margin: 0 5px;
        }
    }

    .item {
        margin: 10px 0;
        gap:15px;

        p {
            margin: 10px 0 10px 0;
        }


        .color-item {
            padding: 5px 10px;
            border-radius: 5px;
            box-shadow: 0px 0px 4px 2px var(--el-shadow-color);
        }

        .color-item-1 {
            // width: 60px;
            height: 60px;
            border-radius: 5px;
            // overflow: hidden;
            align-items: flex-end;
            box-shadow: 0px 0px 4px 2px var(--el-shadow-nav);


            div {
                box-shadow: 0px 0px 4px 2px var(--el-shadow-nav);
                background-color: var(--el-bg-color-second);
                padding: 0px 10px;
                border-radius: 3px;
            }
        }
    }
}

.el-checkbox {
    margin-right: 0;
}

</style>
