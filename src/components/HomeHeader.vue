<template>
    <div class="full-w home-header" :class="{ 'web-gray': checkDate('公祭日') }">
        <div class="flex-start" style="gap:10px">
            <img :src="require('/logo.png')" class="pointer" @click="$router.push('/')">
            <h1 class="isShowWebTitle">{{ $t('message.webTitle') }}</h1>
        </div>
        <div class="flex-end">
            <el-tooltip
            content="客户端下载"
            placement="bottom">
                <el-icon style="margin-right: 20px;" v-if="!checkIsClientEnv()" @click="handleDownloadClient"><Monitor /></el-icon>
            </el-tooltip>

            <el-tooltip
            :content="editSpaceStore.themeValue ? '夜间模式' : '白天模式'"
            placement="bottom">
                <el-icon style="margin-right: 20px;" @click="changeTheme" v-if="editSpaceStore.themeValue"><Moon /></el-icon>
                <el-icon style="margin-right: 20px;" @click="changeTheme" v-else><Sunny /></el-icon>
            </el-tooltip>


            <el-tooltip
            effect="dark"
            :content="$t('message.donate')"
            placement="bottom">
                <el-icon style="margin-right: 20px;" @click="editSpaceStore.donateVisible=true"><ShoppingCart /></el-icon>
            </el-tooltip>

                        
            <el-tooltip
            effect="dark"
            :content="$t('message.fullscreen')"
            placement="bottom">
                <el-icon style="margin-right: 20px;" @click="ScreenFull"><FullScreen /></el-icon>
            </el-tooltip>

            <el-dropdown trigger="click" @command="handleCommand">
                <span class="el-dropdown-link">
                    {{ $t('message.language')}}
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                <el-dropdown-menu>
                    <!-- <el-dropdown-item command="en">{{ $t('message.en') }}</el-dropdown-item> -->
                    <el-dropdown-item command="zh">{{ $t('message.zh') }}</el-dropdown-item>
                </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>
    <Teleport to='body'>
        <DonateDialog v-if="editSpaceStore.donateVisible" :visible="editSpaceStore.donateVisible" @close="editSpaceStore.donateVisible=false"></DonateDialog>
    </Teleport>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, getCurrentInstance, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import fullScreen from '@/hooks/fullScreen';
import DonateDialog from '@/components/dialog/DonateDialog.vue';
import { useEditSpaceStore } from '@/store';
import { checkIsClientEnv, checkDate } from '@/utils/utils';
export default defineComponent({
    name: 'HomeHeader',
    components: { DonateDialog },
    props: {
    },
    emits: ['changeLanguage', 'changeTheme'],
    setup (props, context) 
    {
        const { proxy }:any = getCurrentInstance();
        const { locale: i18nLanguage } = useI18n();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            donateVisible:false
        });
        let methods = {
            handleCommand (command: string) 
            {
                i18nLanguage.value = command;
                proxy.$utils.cache.lang.set(command);
                editSpaceStore.lang = command;
                context.emit('changeLanguage');
            },
            changeTheme ()
            {
                context.emit('changeTheme');
            },
            handleDownloadClient ()
            {
                if (editSpaceStore.clientDownloadLink === 'null') return proxy.$message.info('暂无下载链接');
                window.open(editSpaceStore.clientDownloadLink, '_blank');
            }
        };


        onMounted(() => 
        {
            //
        });

        return {
            ...toRefs(data),
            ...methods,
            ...fullScreen(),
            checkIsClientEnv,
            checkDate,
            editSpaceStore
        };
    }
});
</script>
<style lang='scss' scoped>
.home-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    z-index: 12;
    background-color: var(--el-bg-color);
    box-shadow: 0px 0px 4px 4px var(--el-shadow-nav);
    padding: 0 16px;

    img {
        width: 32px;
        height: 32px;
    }

    h1 {
        // font-weight: 600;
        // margin-left: 15px;
        font-size: 25px;
    }

    i {
        cursor: pointer;
        &:hover {
            color: var(--el-color-primary);
        }
    }

}
</style>
