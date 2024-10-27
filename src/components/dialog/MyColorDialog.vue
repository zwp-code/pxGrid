<template>
    <el-dialog v-model="dialogVisible" 
    title="我的颜色"
    :width="500"
    :modal="false"
    :close-on-click-modal="false"
    draggable="true"
    :before-close="handleClose"
    @open="getData"
    class="z-dialog" center>
        <div class="scrollbar body">
            <div class="content" v-if="editSpaceStore.myColorList.length">
                <div v-for="item in editSpaceStore.myColorList" :key="item.id" class="flex-column-start myColorItem">

                    <div class="flex-between full-w">
                        <el-input
                        v-model="editGroupName.label"
                        style="width:150px"
                        placeholder="请输入名称"
                        size="small"
                        maxlength="10"
                        v-if="editGroupName.id===item.id"
                        @blur="handleSaveGroupName"
                        @keyup.enter="handleSaveGroupName"
                        />
                        <p class="myColorLabel" v-else>{{ item.groupName }}</p>
                        <div class="flex-end" v-if="item.id!==1">
                            <el-icon style="margin-right:10px" class="pointer" @click="editGroupName.id=item.id;editGroupName.label=item.groupName"><Edit /></el-icon>
                            <el-popconfirm title="确认删除该颜色组？" width="200" @confirm="handleDeleteGroup(item.id)">
                                <template #reference>
                                    <el-icon class="pointer"><Delete /></el-icon>
                                </template>
                            </el-popconfirm>
                        </div>
                    </div>
                    <div style="margin-top:10px" class="flex-start flex-warp">
                        <el-popover 
                        v-for="(value, index) in item.list" :key="index"
                        placement="bottom" 
                        trigger="click" 
                        :width="250" 
                        :visible="editMyColorMask !== null && editMyColorMask.id===item.id && editMyColorMask.index===index">
                            <template #reference>
                                <el-dropdown trigger="contextmenu">
                                    <div :style="{backgroundColor: value}" class="mycolor" @click="handleChangeColor(value)"></div>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                        <el-dropdown-item @click="copyText(value)">复 制</el-dropdown-item>
                                        <el-dropdown-item @click="handleEditMyColor(value, item.id, index)">修 改</el-dropdown-item>
                                        <el-dropdown-item @click="handleDeleteMyColor(index, item.id)">删 除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </template>
                            <div>
                                <p>修改颜色</p>
                                <div class="flex-between" style="margin-top: 10px;">
                                    <el-color-picker v-model="myColor" show-alpha/>
                                    <el-select v-model="myColorGroup" placeholder="选择分组" style="width: 150px">
                                        <el-option
                                            v-for="item in editSpaceStore.myColorList"
                                            :key="item.id"
                                            :label="item.groupName"
                                            :value="item.id"
                                            />
                                            <template #footer>
                                                <el-button v-if="!isAddGroup" text bg size="small" @click="isAddGroup=true">
                                                    新建分组
                                                </el-button>
                                                <template v-else>
                                                    <el-input
                                                    v-model="myGroupName"
                                                    class="option-input"
                                                    placeholder="请输入分组"
                                                    size="small"
                                                    maxlength="10"
                                                    />
                                                    <div class="flex-end">
                                                        <el-button size="small" @click="myGroupName='';isAddGroup=false">取消</el-button>
                                                        <el-button type="primary" size="small" @click="addColorGroup">保存</el-button>  
                                                    </div>
                                                    
                                                </template>
                                            </template>
                                    </el-select>
                                </div>
                                
                                <div class="flex-end" style="margin-top: 10px;">
                                    <el-button type="primary" plain @click="editMyColorMask=null">取 消</el-button>
                                    <el-button type="primary" @click="handleAddColor">保 存</el-button>
                                </div>
                            </div>
                        </el-popover>
                        
                        <div class="mycolor flex-center" style="background-color: var(--el-bg-color-second);">
                            <el-popover placement="bottom" :width="250" trigger="click" :visible="addMyColorVisible===item.id&&!editMyColorMask">
                                <template #reference>
                                    <el-icon color="#808080" @click="handleAdd(item.id)"><Plus /></el-icon>
                                </template>
                                <div>
                                    <p>{{editMyColorMask?'修改颜色':'添加颜色'}}</p>
                                    <div class="flex-between" style="margin-top: 10px;">
                                        <el-color-picker v-model="myColor" show-alpha/>
                                        <el-select v-model="myColorGroup" placeholder="选择分组" style="width: 150px">
                                            <el-option
                                                v-for="item in list"
                                                :key="item.id"
                                                :label="item.groupName"
                                                :value="item.id"
                                                />
                                                <template #footer>
                                                    <el-button v-if="!isAddGroup" text bg size="small" @click="isAddGroup=true">
                                                        新建分组
                                                    </el-button>
                                                    <template v-else>
                                                        <el-input
                                                        v-model="myGroupName"
                                                        class="option-input"
                                                        placeholder="请输入分组"
                                                        size="small"
                                                        maxlength="10"
                                                        />
                                                        <div class="flex-end">
                                                            <el-button size="small" @click="myGroupName='';isAddGroup=false">取消</el-button>
                                                            <el-button type="primary" size="small" @click="addColorGroup">保存</el-button>  
                                                        </div>
                                                        
                                                    </template>
                                                </template>
                                        </el-select>
                                    </div>
                                    
                                    <div class="flex-end" style="margin-top: 10px;">
                                        <el-button type="primary" plain @click="addMyColorVisible=0">取 消</el-button>
                                        <el-button type="primary" @click="handleAddColor">保 存</el-button>
                                    </div>
                                </div>
                            </el-popover>
                        </div>
                        
                    </div>
                    
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance } from 'vue';
import { copyText, getColumnsList } from '@/utils/utils';
import { useEditSpaceStore } from '@/store';
export default defineComponent({
    name: 'MyColorDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close', 'select'],
    setup (props, context) 
    {
        let { proxy }:any = getCurrentInstance();
        let editSpaceStore = useEditSpaceStore();
        let data = reactive({
            dialogVisible:false,
            list:[] as any,
            myColor:'#ffffff',
            myColorGroup:1,
            isAddGroup:false,
            myGroupName:'',
            addMyColorVisible:0,
            editMyColorMask:null as any,
            editGroupName:{
                id:0,
                label:''
            }
        });
        let methods = {
            handleAdd (id)
            {
                data.addMyColorVisible = id;
                data.editMyColorMask = null;
                data.myColorGroup = id;
                data.myColor = '#ffffff';
            },
            handleChangeColor (value)
            {
                context.emit('select', value);
                // methods.handleClose();
            },
            handleOpen ()
            {
                data.dialogVisible = true;
            },
            handleClose ()
            {
                data.dialogVisible = false;
                data.addMyColorVisible = 0;
                data.editMyColorMask = null;
                // context.emit('close');
            },
            getData ()
            {
                let colorList = proxy.$utils.cache.mycolor.get();
                if (colorList)
                {
                    data.list = JSON.parse(colorList);
                    editSpaceStore.setMyColorList(data.list);
                    console.log(editSpaceStore.myColorList);
                    
                }
            },
            addColorGroup ()
            {
                if (data.myGroupName !== '')
                {
                    data.list.push({
                        id:data.list.length + 1,
                        groupName:data.myGroupName,
                        list:[]
                    });
                    data.isAddGroup = false;
                    data.myGroupName = '';
                    data.myColorGroup = data.list.length;
                }
            },
            handleAddColor ()
            {
                data.list.forEach((item) => 
                {
                    if (data.editMyColorMask)
                    {
                        if (item.id === data.editMyColorMask.id && data.editMyColorMask.id === data.myColorGroup)
                        {
                            // let index = item.list.findIndex((item) => item === data.editMyColorMask.value)
                            item.list[data.editMyColorMask.index] = data.myColor;
                        }
                        else if (item.id === data.editMyColorMask.id && data.editMyColorMask.id !== data.myColorGroup)
                        {
                            // let index = item.list.findIndex((item) => item === data.editMyColorMask.value)
                            item.list.splice(data.editMyColorMask.index, 1);
                            for (let i = 0; i < data.list.length; i++)
                            {
                                if (data.myColorGroup === data.list[i].id)
                                {
                                    data.list[i].list.push(data.myColor);
                                    break;
                                }
                            }
                        }
                    }
                    else
                    {
                        if (item.id === Number(data.myColorGroup))
                        {
                            item.list.push(data.myColor);
                        }
                    }
                    
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.list));
                editSpaceStore.setMyColorList(data.list);
                data.addMyColorVisible = 0;
                data.editMyColorMask = null;
            },
            handleEditMyColor (value, id, index)
            {
                // data.addMyColorVisible = id;
                data.editMyColorMask = {
                    id,
                    value,
                    index
                };
                data.myColorGroup = id;
                data.myColor = value;
                console.log(data.editMyColorMask);
                
            },
            handleSaveGroupName ()
            {
                data.list.forEach((item) => 
                {
                    if (item.id === data.editGroupName.id)
                    {
                        item.groupName = data.editGroupName.label;
                    }
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.list));
                editSpaceStore.setMyColorList(data.list);
                data.editGroupName.id = 0;
                data.editGroupName.label = '';
            },
            handleDeleteMyColor (index, id)
            {
                data.list.forEach((item) => 
                {
                    if (item.id === id)
                    {
                        item.list.splice(index, 1);
                    }
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.list));
                editSpaceStore.setMyColorList(data.list);
            },
            handleDeleteGroup (id)
            {
                data.list.forEach((item, index) => 
                {
                    if (item.id === id)
                    {
                        data.list.splice(index, 1);
                    }
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.list));
                editSpaceStore.setMyColorList(data.list);
            }
            
        };

        onMounted(() => 
        {
            // methods.getData();
        });
        return {
            ...toRefs(data),
            ...methods,
            copyText,
            editSpaceStore
        };
    }
});
</script>
<style lang='scss' scoped>
.body {
    max-height: 500px;
    overflow: auto;
}
.content {
    padding: 5px;
    display: flex;
    flex-wrap: wrap;
    // column-count: 2;
    // column-gap: 10px;
    // -webkit-column-width: 100px;

    .myColorItem {
        // break-inside: avoid;
        width: 100%;
        padding: 10px;
        border-radius: 10px;
        background-color: var(--el-bg-color-second);
        margin-bottom: 10px;

        .myColorLabel {
            margin-left: 10px;
        }
        .mycolor {
            cursor: pointer;
            border-radius: 3px;
            width: 20px;
            height: 20px;
            box-shadow: 0px 0px 4px 4px var(--el-shadow-color);
            margin: 10px;
        }
    }
}

.option-input {
    width: 150px;
    margin-bottom: 8px;
}

</style>
