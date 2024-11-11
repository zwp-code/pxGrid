<template>
    <el-dialog 
    v-model="dialogVisible" 
    title="自定义拼豆"
    :width="600"
    append-to-body
    :before-close="handleClose"
    class="z-dialog" center>
        <div class="content">
            <div class="item flex-start">
                <el-select 
                v-model="pindouBrand" 
                placeholder="请选择" 
                style="width:200px"
                @change="handleChange"
                clearable>
                    <el-option
                        v-for="item in myCustom"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <el-input v-model="customPindouName" placeholder="请输入" style="width:200px"/>
                <el-tooltip
                    content="保存"
                    placement="top"
                    >
                        <el-button type="primary" :icon="Edit" @click="handleSavePindou"/>
                    </el-tooltip>

                <el-popconfirm title="确定删除?" @confirm="handleDeletePindou">
                    <template #reference>
                        <el-button type="primary" :icon="Delete" :disabled="pindouBrand===''"/>
                    </template>
                </el-popconfirm>
                <el-dropdown>
                    <el-button type="warning" :icon="Upload" :disabled="pindouBrand===''"/>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="importFile">导入文件</el-dropdown-item>
                            <el-dropdown-item @click="exportFile(false)">导出文件</el-dropdown-item>
                            <el-dropdown-item @click="exportFile(true)">下载模板</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <el-tooltip
                    content="新增"
                    placement="top"
                    >
                    <el-button type="success" :icon="Plus" @click="handleAdd" :disabled="pindouBrand===''"/>
                </el-tooltip>
            </div>
            <div>
                <el-table :data="list" style="width: 100%" max-height="500">
                    <el-table-column prop="name" label="标 识" width="150" />
                    <el-table-column prop="color" label="颜 色">
                        <template #default="scope">
                            <div
                            class="flex-center color-item" 
                            :style="{backgroundColor:'#' + scope.row.color,color:getFontColor('#' + scope.row.color)}">
                            #{{scope.row.color}}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column fixed="right" label="操 作" width="120">
                        <template #default="scope">
                            <el-popconfirm title="确定删除?" @confirm="handleDelete(scope.row)">
                                <template #reference>
                                    <el-button link type="primary" size="small">删 除</el-button>
                                </template>
                            </el-popconfirm>
                            <el-button link type="primary" size="small" @click="innerVisible=true;editMask=true;color=`#${scope.row.color}`;name=scope.row.name">编 辑</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

        </div>
        <!-- <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose"
                >{{$t('message.cancel')}}</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="loading"
                >{{$t('message.save')}}</el-button>
            </span>
        </template> -->

        <el-dialog
        v-model="innerVisible"
        width="300"
        :title="editMask?'修改':'添加'"
        append-to-body
        class="z-dialog"
        >
            <div class="flex-between" style="margin-top: 10px;">
                <el-input v-model="name" placeholder="请输入" style="width:200px" :disabled="editMask"/>
                <el-color-picker v-model="color" @change="console.log(color)"/>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="hideDiaog">{{$t('message.cancel')}}</el-button>
                    <el-button type="primary" @click="handleEdit">{{$t('message.save')}}</el-button>
                </div>
            </template>
        </el-dialog>
    </el-dialog>
</template>

<script lang="ts">
import {
    Upload,
    Plus,
    Delete,
    Edit
} from '@element-plus/icons-vue';
import { useEditSpaceStore } from '@/store';
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance, watchEffect, watch } from 'vue';
import pindouMap from '@/config/pindou'; 
import { getFontColor } from '@/utils/utils';
import * as XLSX from 'xlsx';
import { ElMessageBox } from 'element-plus';
export default defineComponent({
    name: 'CustomPindouDialog',
    components: {},
    props: {

    },
    emits: ['close', 'update'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:false,
            loading:false,
            list:[] as any,
            myCustom:[] as any,
            pindouBrand:'',
            customPindouName:'',
            innerVisible:false,
            name:'',
            color:'',
            editMask:false,
            customData:{} as any
        });
        
        let methods = {
            
            handleClose ()
            {
                data.dialogVisible = false;
            },
            handleOpen ()
            {
                data.dialogVisible = true;
                if (data.myCustom.length) return;
                let pindouData = proxy.$utils.cache.pindou.get();
                if (pindouData)
                {
                    data.myCustom = JSON.parse(pindouData);
                    if (data.pindouBrand === '') 
                    {
                        data.pindouBrand = data.myCustom[0].value;
                        data.list = methods.getList();
                    }
                }
            },
            getList (key = data.pindouBrand)
            {
                if (key !== '')
                {
                    return editSpaceStore.pindouMaps[key];
                }
                return [];
            },
            saveData ()
            {
                proxy.$utils.cache.pindou.set(JSON.stringify(data.myCustom));
                context.emit('update');
            },
            handleChange (e)
            {
                if (data.pindouBrand === '') 
                {
                    data.list = [];
                    
                }
                else
                {
                    data.list = methods.getList(data.pindouBrand);
                }
            },

            async handleSavePindou ()
            {
                // 保存自定义拼豆
                if (data.customPindouName.trim() === '') return proxy.$message.warning('请输入自定义拼豆名称');
                if (Object.keys(editSpaceStore.pindouMaps).find((v) => v === data.customPindouName)) return proxy.$message.warning('拼豆名称不能重复');
                if (data.myCustom.find((v) => v.value === data.pindouBrand))
                {
                    // 编辑
                    if (pindouMap.has(data.pindouBrand)) return proxy.$message.warning('该拼豆不能编辑');
                    const deleteData = await editSpaceStore.deletePindouById(data.pindouBrand);
                    const flag = await editSpaceStore.savePindouData({id:data.customPindouName, value:deleteData});
                    if (flag) 
                    {
                        data.myCustom.forEach((item) => 
                        {
                            if (item.value === data.pindouBrand)
                            {
                                item.value = data.customPindouName;
                                item.label = data.customPindouName;
                            }
                        });
                        methods.saveData();
                        data.pindouBrand = data.customPindouName;
                        proxy.$message.success('已保存');
                    }
                    return;
                }
                const flag = await editSpaceStore.savePindouData({id:data.customPindouName, value:[]});
                if (flag) 
                {
                    data.myCustom.push({
                        label:data.customPindouName,
                        value:data.customPindouName
                    });
                    data.pindouBrand = data.customPindouName;
                    data.list = [];
                    methods.saveData();
                    proxy.$message.success('已新增');
                }
            },
            async handleDeletePindou ()
            {
                if (pindouMap.has(data.pindouBrand)) return proxy.$message.warning('该拼豆不能删除');
                let index = data.myCustom.findIndex((v) => v.value === data.pindouBrand);
                if (index >= 0)
                {
                    const flag = await editSpaceStore.deletePindouById(data.pindouBrand);
                    if (flag)
                    {
                        data.myCustom.splice(index, 1);
                        data.pindouBrand = data.myCustom[0]?.value ? data.myCustom[0]?.value : '';
                        data.list = methods.getList();
                        methods.saveData();
                        proxy.$message.success('已删除');
                    }
                }
            },
            handleAdd ()
            {
                data.innerVisible = true;
                data.editMask = false;
                data.name = '';
                data.color = '';
            },
            hideDiaog ()
            {
                data.innerVisible = false;
            },
            handleEdit ()
            {
                if (data.editMask)
                {
                    data.list.forEach((item) => 
                    {
                        if (item.name === data.name)
                        {
                            item.color = data.color.slice(1);
                        }
                    });
                }
                else
                {
                    let flag = data.list.find((item) => item.name === data.name);
                    if (flag) 
                    {
                        return proxy.$message.warning('标识不能重复');
                    }
                    data.list.push({
                        name:data.name,
                        color:data.color.slice(1)
                    });
                }
                // data.customData[data.pindouBrand] = data.list;
                editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list}).then((res) => 
                {
                    // methods.saveData();
                    proxy.$message.success('已保存');
                    methods.hideDiaog();
                }).catch((err) => 
                {
                    console.error(err);
                    proxy.$message.error('保存失败');
                });
            },
            handleDelete (row)
            {
                let index = data.list.findIndex((item) => item.name === row.name);
                if (index >= 0) 
                {
                    data.list.splice(index, 1);
                }
                editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list}).then((res) => 
                {
                    // methods.saveData();
                    proxy.$message.success('已删除');
                }).catch((err) => 
                {
                    console.error(err);
                    proxy.$message.error('删除失败');
                });
            },
            exportFile (isTemplate = false)
            { 
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(isTemplate ? [{ name:'A1', color:'000000' }] : data.list);
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, `${data.pindouBrand}.xlsx`);
            },
            importFile ()
            {
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = '.xls,.xlsx';
                input.addEventListener('change', function () 
                {
                    const file = input.files[0];
                    if (file) 
                    {
                        const reader = new FileReader();
                        reader.onload = function (e:any) 
                        {
                            const res = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(res, { type: 'array' });
                            let list = [] as any;
                            workbook.SheetNames.forEach(function (sheetName) 
                            {
                                const worksheet = workbook.Sheets[sheetName];
                                const sheetData = XLSX.utils.sheet_to_json(worksheet);
                                list = list.concat(sheetData);
                            });
                            methods.openInfo(list);

                        };
                        reader.readAsArrayBuffer(file);
                        
                    }
                });
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            },
            openInfo (newList)
            {
                ElMessageBox.confirm(
                    '是否覆盖已有数据?',
                    '提 示',
                    {
                        confirmButtonText: '确 认',
                        cancelButtonText: '取 消',
                        type: 'warning'
                    }
                )
                    .then(() => 
                    {
                        data.list = newList;
                        editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list}).then((res) => 
                        {
                            // methods.saveData();
                            proxy.$message.success('已覆盖');
                        }).catch((err) => 
                        {
                            console.error(err);
                            proxy.$message.error('保存失败');
                        });
                    })
                    .catch(() => 
                    {
                        //
                    });
            }
        };

        onMounted(() => 
        {
            // methods.getData();
        });

        watch(() => data.pindouBrand, (newValue, oldValue) => 
        {
            console.log(newValue, oldValue);
            if (newValue)
            {
                data.customPindouName = newValue;
            }
            else
            {
                data.customPindouName = '';
                data.pindouBrand = '';
            }
            
        });
        return {
            ...toRefs(data),
            ...methods,
            Upload,
            Plus,
            Delete,
            Edit,
            getFontColor
        };
    }
});
</script>
<style lang='scss' scoped>
.content {
    padding:10px;
    max-height: 500px;
    overflow: hidden;

    .item {
        gap:10px;
        margin-bottom: 10px;

        button {
            margin: 0;
        }
    }

    .color-item {
        max-width: 100px;
        padding: 2px 5px;
        margin: 3px 0;
        border-radius: 5px;
        box-shadow: 0px 0px 4px 2px var(--el-shadow-color);
    }
}
</style>
