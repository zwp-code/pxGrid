<template>
    <el-dialog v-model="dialogVisible" title="微信赞赏码"
    :width="500"
    :lock-scroll="false"
    :before-close="handleClose"
    class="z-dialog" center>
        <div class="flex-column-center price-content scrollbar">
            <div class="price-item flex-center">
                <el-image
                :src="require('@/assets/wxDonate.png')"
                fit="contain" />
                <p>（请您在微信支付时填写留言(昵称),以便在赞助列表中展示！）</p>
            </div>
            <div v-if="false">
                <h3>赞助者</h3>
                <div class="flex-warp flex-start thanks-box">
                    <div v-for="item in thanks" :key="item.id">
                        <el-link :href="item.link||'#'"  :underline="false" class="flex-center">
                            <el-avatar :src="item.avatar || require('@/assets/boy.png')" :size="30"/>
                            {{ item.name }}(${{item.amount}})
                        </el-link>
                    </div>
                </div>
            </div>
        </div>
        
    </el-dialog>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted } from 'vue';
import axios from 'axios';
export default defineComponent({
    name: 'DonateDialog',
    components: {},
    props: {
        visible:{
            type:Boolean,
            default:false
        }
    },
    emits: ['close'],
    setup (props, context) 
    {
        let data = reactive({
            dialogVisible:props.visible,
            thanks:[] as any
        });
        let methods = {
            handleClose ()
            {
                data.dialogVisible = false;
                context.emit('close');
            },
            getData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/donate.json`)
                    .then((res) => 
                    {
                        data.thanks = res.data;
                    })
                    .catch((err) => 
                    {
                        console.error(err);
                    });
            }
        };

        onMounted(() => 
        {
            // methods.getData();
        });
        return {
            ...toRefs(data),
            ...methods
        };
    }
});
</script>
<style lang='scss' scoped>
@keyframes AnimationShow {
    from { opacity: 0; }
    to { opacity: 1; }
}
.price-content {
    max-height: 500px;
    overflow: auto;

    .price-item {
        flex-direction: column;
        cursor: pointer;
        // padding: 0 50px;
        margin: 10px 0;
        transition: .4s;
        animation: AnimationShow 1s forwards;

        :deep(.el-image) {
            width: 300px;
        }

        p {
            padding: 15px 0 0 0;
            text-align: center;
            font-size: 15px;
        }
    }

    .thanks-box {
        padding-top: 1rem;
        grid-gap: 1rem;
        gap: 1rem;

        :deep(.el-link__inner) {
            gap: 0.5rem;
        }
    }

}
</style>
