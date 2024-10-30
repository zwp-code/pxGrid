<template>
    <div class="full-w home-footer">
        <p>{{ $t('message.footer') }}</p>
    </div>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted } from 'vue';
export default defineComponent({
    name: 'HomeFooter',
    components: {},
    props: {
    },
    emits: [],
    setup (props, context) 
    {
        let data = reactive({
        });
        let methods = {
            
        };

        // onMounted(() => 
        // {
            
        // });
        return {
            ...toRefs(data),
            ...methods
        };
    }
});
</script>
<style lang='scss' scoped>
.home-footer {
    position: absolute;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 0;
    border-top: 1px solid #efefef;
    background-color: #fff;

    p {
        background-image: linear-gradient(0deg, #bfb7a9, #150b02);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        font-size: 14px;
    }
}
</style>
