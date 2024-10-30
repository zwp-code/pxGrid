import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide, computed, onActivated, watch } from 'vue';
import NewProjectDialog from '@/components/dialog/NewProjectDialog.vue';
import { useEditSpaceStore } from '@/store';
import Worker from '@/utils/worker.js?worker';
import { ArrowDownBold } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

export default defineComponent({
    name:'project',
    components: {
        NewProjectDialog
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        // const useDBHooks = useDB();
        let data = reactive({
            isExporting:false,
            NewProjectVisible:false,
            editProjectInfo:null as any
        });
     
       
        let methods = {
            getProjectData ()
            {
                let projectData = proxy.$utils.cache.project.get();
                if (projectData)
                {
                    editSpaceStore.projectList = JSON.parse(projectData);
                }
            },
            handleOpenProject (projectId)
            {
                editSpaceStore.saveProjectId(projectId);
                proxy.$router.push({
                    name:'work',
                    params:{
                        projectId
                    }
                });
            },
            handleEditProject (projectData)
            {
                data.editProjectInfo = projectData;
                data.NewProjectVisible = true;
            },
            handleExportProject (projectId)
            {
                //
            },
            handleDeleteProject (projectId)
            {
                //
            }
        };
        
        onMounted(() => 
        {
            methods.getProjectData();
        });

        // onActivated(() => 
        // {
        //     methods.getProjectData();
        // });

        // watch(() => editSpaceStore.isUpload, (newValue) => 
        // {
        //     if (!newValue)
        //     {
        //         methods.getProjectData();
        //     }            
        // });

        return {
            ...toRefs(data),
            ...methods,
            editSpaceStore,
            ArrowDownBold

        };
    }
});