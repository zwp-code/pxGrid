<template>
    <el-main class="routerview-right scrollbar" :class="{'relative':!editSpaceStore.isFullWork}">
        <!-- <el-backtop :right="40" :bottom="40" target=".routerview-right .scrollbar"/> -->
        <router-view v-slot="{ Component }">
            <keep-alive :include="['about', 'work', 'project']">
                <component :is="Component"></component>
            </keep-alive>
        </router-view>
    </el-main>
</template>

<script lang="ts">
import { useEditSpaceStore } from '@/store';
import { defineComponent, reactive, ref, toRefs } from 'vue';
export default defineComponent({
    name:'HomeRouter',
    components:{},
    emits: [],
    props:{},
    setup (props, context) 
    {
        let editSpaceStore = useEditSpaceStore();
        let data = reactive({
        });
        let methods = {

        };
        return {
            ...toRefs(data),
            ...methods,
            editSpaceStore
        };
    }
});
</script>

<style scoped lang="scss">
.routerview-right {
    padding: 0 !important;
    height: 100%;
    // width: 100%;
    overflow-y:hidden !important;
    overflow-x: auto !important;
    flex: 1 !important;
    // display: flex !important;
}
</style>