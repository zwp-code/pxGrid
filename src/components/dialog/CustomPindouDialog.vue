<template>
    <el-dialog 
    v-model="dialogVisible" 
    title="自定义拼豆"
    :width="600"
    append-to-body
    :before-close="handleClose"
    :lock-scroll="false"
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
                    <template #footer>
                        <el-button v-if="!isAddPindou" text bg size="small" @click="isAddPindou=true">
                            新建拼豆色卡
                        </el-button>
                        <template v-else>
                            <div class="flex-column-start">
                                <el-input
                                v-model="customPindouKey"
                                class="option-input"
                                placeholder="请输入拼豆属性[仅支持数字和英文]"
                                size="small"
                                maxlength="20"
                                @input="handleInput"
                                />
                                <el-input
                                v-model="customPindouName"
                                class="option-input"
                                placeholder="请输入拼豆名称"
                                size="small"
                                maxlength="15"
                                />
                            </div>
                            <div class="flex-end">
                                <el-button size="small" @click="customPindouKey='';customPindouName='';isAddPindou=false">取消</el-button>
                                <el-button type="primary" size="small" @click="handleSavePindou('save')">保存</el-button>  
                            </div>
                            
                        </template>
                    </template>
                </el-select>
                <el-input v-model="customPindouLabel"
                placeholder="请输入拼豆名称" style="width:200px" :disabled="pindouBrand===''"/>
                <el-tooltip
                    content="保存"
                    placement="top"
                    >
                        <el-button type="primary" :icon="Edit" @click="handleSavePindou('edit')" :disabled="pindouBrand===''"/>
                    </el-tooltip>

                <el-popconfirm title="确定删除该拼豆?" @confirm="handleDeletePindou">
                    <template #reference>
                        <el-button type="primary" :icon="Delete" :disabled="pindouBrand===''"/>
                    </template>
                </el-popconfirm>
                <el-dropdown>
                    <el-button type="warning" :icon="Upload" :disabled="pindouBrand===''"/>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="exportFile(true)">下载空模板</el-dropdown-item>
                            <el-dropdown-item @click="importExcelFile">导入为Excel</el-dropdown-item>
                            <el-dropdown-item @click="exportFile(false)">导出为Excel</el-dropdown-item>
                            <el-dropdown-item @click="importJSONFile">导入为JSON</el-dropdown-item>
                            <el-dropdown-item @click="exportJSONFile">导出为JSON</el-dropdown-item>
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
            <div class="flex" style="gap: 10px;">
                <el-input v-model="searchValue" placeholder="搜索色号" clearable @keyup.enter="handleSearch" :disabled="pindouBrand===''"/>
                <el-button type="danger" @click="handleBatchDelete" :disabled="pindouBrand===''">批量删除</el-button>
            </div>
            <div>
                <el-table 
                :data="searchData.length ? searchData : list ? (list.data || list) : []" 
                style="width: 100%" max-height="500"
                @selection-change="handleSelectionChange">
                    <el-table-column type="selection" :selectable="selectable" width="55" />
                    <el-table-column prop="name" label="色 号" width="150" sortable/>
                    <el-table-column prop="color" label="色 值">
                        <template #default="scope">
                            <div
                            class="flex-center color-item pointer"
                            @click="copyText(`#${scope.row.color}`)"
                            :style="{backgroundColor:'#' + scope.row.color,color:getFontColor('#' + scope.row.color)}">
                            #{{scope.row.color}}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column fixed="right" label="操 作" width="120">
                        <template #default="scope">
                            <el-popconfirm title="确定删除该色号?" @confirm="handleDelete(scope.row)">
                                <template #reference>
                                    <el-button link type="primary" size="small">删 除</el-button>
                                </template>
                            </el-popconfirm>
                            <el-button link type="primary" size="small" @click="innerVisible=true;editMask=scope.$index;color=`#${scope.row.color}`;name=scope.row.name;">编 辑</el-button>
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
        :title="editMask >= 0 ?'修改':'添加'"
        append-to-body
        class="z-dialog"
        >
            <div class="flex-between" style="margin-top: 10px;">
                <el-input v-model="name" placeholder="请输入" style="width:200px" :disabled="editMask >= 0"/>
                <el-color-picker v-model="color"/>
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
import { getFontColor, copyText, isHexColor, isRgbaColor } from '@/utils/utils';
import * as XLSX from 'xlsx';
import { ElMessageBox } from 'element-plus';
import FileSaver from 'file-saver';

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
            list:null as any,
            myCustom:[] as any,
            pindouBrand:'',
            customPindouKey:'',
            customPindouName:'',
            customPindouLabel:'',
            innerVisible:false,
            name:'',
            color:'',
            editMask:-1,
            customData:{} as any,
            isAddPindou:false,
            searchValue:'',
            searchData:[] as any,
            selectRows:[]
        });
        
        let methods = {
            selectable (row)
            {
                return true;
            },
            handleSelectionChange (val)
            {
                data.selectRows = val;
            },
            handleSearch ()
            {
                if (data.searchValue.trim() === '') return proxy.$message.warning('请输入搜索内容');
                let reg = new RegExp(data.searchValue, 'i');
                data.searchData = data.list && data.list.data.filter((item) => 
                {
                    return reg.test(item.name);
                });
            },
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
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
                if (key && key !== '')
                {
                    return JSON.parse(JSON.stringify(editSpaceStore.pindouMaps[key])) || null;
                }
                return null;
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
                    data.list = null;
                    console.log(data.pindouBrand);
                }
                else
                {
                    data.list = methods.getList(data.pindouBrand);
                }
            },

            async handleSavePindou (type)
            {
                // 保存自定义拼豆
                // if (data.customPindouName.trim() === '' || data.customPindouKey.trim() === '') return proxy.$message.warning('请输入拼豆属性和名称');
                // if (Object.keys(editSpaceStore.pindouMaps).find((v) => v === data.customPindouKey)) return proxy.$message.warning('拼豆属性不能重复');
                if (type === 'edit')
                {
                    // 编辑
                    if (pindouMap.has(data.pindouBrand)) return proxy.$message.warning('该拼豆不能编辑');
                    if (data.customPindouLabel.trim() === '') return proxy.$message.warning('请输入拼豆名称');
                    // const deleteData = await editSpaceStore.deletePindouById(data.pindouBrand);
                    const flag = await editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list});
                    if (flag) 
                    {
                        data.myCustom.forEach((item) => 
                        {
                            if (item.value === data.pindouBrand)
                            {
                                item.label = data.customPindouLabel;
                            }
                        });
                        methods.saveData();
                        proxy.$message.success('已保存');
                    }
                    return;
                }
                if (data.customPindouName.trim() === '' || data.customPindouKey.trim() === '') return proxy.$message.warning('请输入拼豆属性和名称');
                if (Object.keys(editSpaceStore.pindouMaps).find((v) => v === data.customPindouKey)) return proxy.$message.warning('拼豆属性不能重复');
                const flag = await editSpaceStore.savePindouData({id:data.customPindouKey, value:{data:[], label:data.customPindouName}});
                if (flag) 
                {
                    data.myCustom.push({
                        label:data.customPindouName,
                        value:data.customPindouKey
                    });
                    data.pindouBrand = data.customPindouKey;
                    data.list = methods.getList();
                    methods.saveData();
                    proxy.$message.success('已新增');
                    data.isAddPindou = false;
                    data.customPindouKey = '';
                    data.customPindouName = '';
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
                data.editMask = -1;
                data.name = '';
                data.color = '';
            },
            hideDiaog ()
            {
                data.innerVisible = false;
            },
            handleEdit ()
            {
                if (data.name === '') return proxy.$message.warning('色号不能为空');
                if (data.color === '') return proxy.$message.warning('颜色不能为空');
                if (!isHexColor(data.color) && !isRgbaColor(data.color)) return proxy.$message.warning('颜色不规范，请输入十六进制的颜色值');
                if (data.editMask >= 0)
                {
                    // data.list.data[data.editMask] = { name: data.name, color: data.color.slice(1).toLowerCase() };
                    data.list && data.list.data.forEach((item) => 
                    {
                        if (item.name === data.name)
                        {
                            item.color = data.color.slice(1, 7).toLowerCase();
                        }
                    });
                }
                else
                {
                    let flag = data.list && data.list.data.find((item) => item.name === data.name);
                    if (flag) 
                    {
                        return proxy.$message.warning('色号不能重复');
                    }
                    // if (data.color === '') return proxy.$message.warning('颜色不能为空');
                    data.list.data.push({
                        name:data.name,
                        color:data.color.slice(1, 7).toLowerCase()
                    });
                }
                // data.customData[data.pindouBrand] = data.list;
                editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list }).then((res) => 
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
                let index = data.list && data.list.data.findIndex((item) => item.name === row.name);
                if (index >= 0) 
                {
                    data.list.data.splice(index, 1);
                }
                editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list }).then((res) => 
                {
                    // methods.saveData();
                    proxy.$message.success('已删除');
                }).catch((err) => 
                {
                    console.error(err);
                    proxy.$message.error('删除失败');
                });
            },
            handleBatchDelete ()
            {
                if (!data.selectRows.length) return proxy.$message.warning('请先选择拼豆色号');
                data.selectRows.forEach((row:any) => 
                {
                    let index = data.list && data.list.data.findIndex((item) => item.name === row.name);
                    if (index >= 0) 
                    {
                        data.list.data.splice(index, 1);
                    }
                });
                editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list }).then((res) => 
                {
                    // methods.saveData();
                    methods.handleSearch();
                    proxy.$message.success('已删除');
                }).catch((err) => 
                {
                    console.error(err);
                    proxy.$message.error('删除失败');
                });
            },
            exportFile (isTemplate = false)
            { 
                let filename = isTemplate ? '拼豆色卡模板' : `${data.pindouBrand}-${data.customPindouLabel}`;
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(isTemplate ? [{ name:'A1', color:'000000' }] : data.list ? data.list.data : []);
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, `${filename}.xlsx`);
            },
            exportJSONFile ()
            {
                const d = JSON.stringify(data.list ? data.list.data : []);
                const blob = new Blob([d], {type: ''});
                FileSaver.saveAs(blob, `${data.pindouBrand}-${data.customPindouLabel}.json`);
            },
            importExcelFile ()
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
            importJSONFile ()
            {
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.addEventListener('change', function () 
                {
                    const file = input.files[0];
                    if (file) 
                    {
                        const reader = new FileReader();
                        reader.onload = function (e:any) 
                        {
                            const jsonData = JSON.parse(e.target.result);
                            methods.openInfo(jsonData);

                        };
                        reader.readAsText(file);
                        
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
                        if (data.list)
                        {
                            data.list.data = newList;
                        }
                        else
                        {
                            data.list = {
                                data:newList,
                                label:data.pindouBrand
                            };
                        }
                        
                        // data.list.data = newList;
                        editSpaceStore.editPindouData({id:data.pindouBrand, value:data.list, label:data.customPindouLabel}).then((res) => 
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
            },
            handleInput (e)
            {
                data.customPindouKey = data.customPindouKey.replace(/[\u4E00-\u9FA5]/g, '');
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
                let obj = data.myCustom.find((item) => item.value === newValue);
                if (obj) data.customPindouLabel = obj.label;
                else data.customPindouLabel = '';
            }
            else
            {
                data.customPindouLabel = '';
                data.pindouBrand = '';
            }
            
        });

        watch(() => data.customPindouLabel, (newValue, oldValue) => 
        {
            console.log(newValue, oldValue);
            if (data.list)
            {
                data.list.label = newValue;
            }
            
        });

        watchEffect(() => 
        {
            if (data.searchValue.trim() === '')
            {
                data.searchData = [];
            }
        });

        return {
            ...toRefs(data),
            ...methods,
            Upload,
            Plus,
            Delete,
            Edit,
            getFontColor,
            copyText
        };
    }
});
</script>
<style lang='scss' scoped>
.content {
    padding:10px;
    max-height: 600px;
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

.option-input {
    width: 250px;
    margin-bottom: 8px;
}
</style>
