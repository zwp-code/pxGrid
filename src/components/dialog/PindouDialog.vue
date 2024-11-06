<template>
    <el-dialog v-model="dialogVisible" title="拼豆"
    :width="500"
    draggable="true"
    :modal="false"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="z-dialog" center>
        <div class="content">
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
            </div>
            <div v-if="selectedObj">
                <div class="item flex-start">
                    <p>当前选择的颜色</p>
                    <div class="flex-center color-item" 
                    :style="{backgroundColor:selectedObj.color, color:getFontColor(selectedObj.color)}">
                        {{selectedObj.name}}
                    </div>
                </div>
                <div class="item flex-start" style="gap:10px">
                    <p>替换颜色</p>
                    <el-select v-model="replaceObj" value-key="name"
                    @change="handleChangeColor" placeholder="请选择" style="width:200px">
                        <el-option
                            v-for="item in pindouColorList"
                            :key="item.name"
                            :label="item.name"
                            :value="item">
                                <span style="float: left">{{ item.name }}</span>
                                <div style="float: right;width: 40px;padding:5px" class="flex-center full-h">
                                    <span 
                                    style="border-radius:5px;box-shadow: 0px 0px 4px 2px var(--el-shadow-color);" 
                                    :style="{backgroundColor:`#${item.color}ff`}" class="full-layout"></span>
                                </div>
                        </el-option>
                    </el-select>
                    <div class="flex-center color-item" v-if="replaceObj" style="width:40px; height:30px"
                    :style="{backgroundColor:replaceObj.color}">
                    </div>
                </div>
                <div>
                    <el-checkbox v-model="checked1" label="单独像素" @change="handleChange($evnet, 1)"/>
                    <el-checkbox v-model="checked2" label="所有像素" @change="handleChange($evnet, 2)"/>
                </div>
            </div>
            <div class="item">
                <el-collapse accordion>
                    <el-collapse-item name="1">
                        <template #title>
                            <div class="flex-between full-w pixelFont">
                                颜色统计
                                <p class="flex-end">数量：{{colorTotal}}</p>
                            </div>
                        </template>
                        <ul class="flex-start flex-warp" style="gap:15px;padding: 5px 0;">
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
                <el-button type="success" @click="handleExport" :disabled="loading"
                >导出拼豆图</el-button>
                <el-button type="primary" @click="handleReplace" :loading="loading" v-if="selectedObj"
                >替换颜色</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { useEditSpaceStore } from '@/store';
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
import pindouMap from '@/config/pindou'; 
import { getFontColor } from '@/utils/utils'; 
export default defineComponent({
    name: 'PindouDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'replace', 'change', 'export'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:false,
            pindouBrand:'mard',
            brandOptions:[
                {
                    label:'Mard 融合豆',
                    value:'mard'
                },
                {
                    label:'Hama',
                    value:'hama'
                },
                {
                    label:'Perler 5mm',
                    value:'perler'
                },
                {
                    label:'Perler mini 2.6mm',
                    value:'perler-mini'
                },
                {
                    label:'Nabbi',
                    value:'nabbi'
                },
                {
                    label:'Artkal S 5mm',
                    value:'artkal-s'
                },
                {
                    label:'Artkal R soft 5mm',
                    value:'artkal-r'
                },
                {
                    label:'Artkal C 2.6mm',
                    value:'artkal-c'
                },
                {
                    label:'Artkal A soft 2.6mm',
                    value:'artkal-a'
                }
            ],
            // currentSelectPindou:null as any,
            colorStatList:null as any,
            colorTotal:0,
            pindouColorList:[] as any,
            replaceObj:null as any,
            selectedObj:null as any,
            checked1:true,
            checked2:false,
            type:1,
            loading:false
        });
        
        let methods = {
            clearStatus ()
            {
                for (let i = 0; i < 2; i++)
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
                data.pindouBrand = 'mard';
                data.replaceObj = null;
                data.selectedObj = null;
                methods.handleChange('', 1);
                context.emit('close');
            },
            handleOpen (value)
            {
                data.dialogVisible = true;
                data.pindouColorList = pindouMap.get(data.pindouBrand);
                data.colorStatList = value.colorStatList;
                data.colorTotal = 0;
                data.colorStatList.forEach((v, k) => 
                {
                    data.colorTotal += v[1];
                });
            },
            handleChangeColor (e)
            {
                data.replaceObj.color = '#' + e.color + 'ff';
            },
            handleExport ()
            {
                // 导出拼豆图
                data.loading = true;
                context.emit('export', () => data.loading = false);
            },
            handleReplace ()
            {
                // 替换颜色
                if (!data.replaceObj) return proxy.$message.warning('替换颜色不能为空');
                data.loading = true;
                context.emit('replace', { type:data.type, replaceObj:data.replaceObj, originObj:data.selectedObj }, () => data.loading = false);
            },
            handleChangeBrand (e)
            {
                data.replaceObj = null;
                data.selectedObj = null;
                proxy.$emit('change', data.pindouBrand);
            }

            // handleConfirm ()
            // {
            //     if (data.replaceColor.trim() === '' || data.newColor.trim() === '') return proxy.$message.warning('颜色不能为空');
            //     data.loading = true;
            //     context.emit('confirm', { type:data.type, replaceColor:data.replaceColor, newColor:data.newColor }, () => data.loading = false);
            // },
            // handleUpdate (color)
            // {
            //     data.replaceColor = color;
            // }
        };

        onMounted(() => 
        {
            // methods.getData();
        });
        return {
            ...toRefs(data),
            ...methods,
            getFontColor
        };
    }
});
</script>
<style lang='scss' scoped>
.content {
    padding:10px;
    max-height: 700px;
    overflow: auto;

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
</style>
