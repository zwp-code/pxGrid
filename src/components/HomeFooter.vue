<template>
    <div class="full-w home-footer">
        <div class="flex-center" v-if="tongjiInfo">
            <div>{{$t('message.todayPv')}}：<span style="color:#e16363">{{tongjiInfo.pv}}{{ $utils.cache.lang.get() === 'zh' ? '次':''}}</span> </div>
            <div>{{$t('message.todayUv')}}：<span style="color:#48a53e">{{tongjiInfo.uv}}{{ $utils.cache.lang.get() === 'zh' ? '人':''}}</span> </div>
        </div>
        <template v-else>
            <div v-if="checkIsClientEnv">{{$t('message.webTitle')}} © 2024 BY Java V1.0.0 </div>
            <div v-else>{{$t('message.webTitle')}} © 2024 BY Java V2.1.0 </div>
        </template>
    </div>
</template>

<script lang="ts">
import config from '@/config';
import cache from '@/utils/cache';
import jsonp from 'jsonp-pro';
import { ref, reactive, toRefs, defineComponent, onMounted, computed } from 'vue';
export default defineComponent({
    name: 'HomeFooter',
    components: {},
    props: {
    },
    emits: [],
    setup (props, context) 
    {
        let data = reactive({
            tongjiInfo:null as any
        });
        const checkIsClientEnv = computed(() => 
        {
            if (import.meta.env.VITE_NODE_ENV === 'client') return true;
            return false;
        });
        let methods = {
            getBaiduData ()
            {
                // 获取百度统计数据
                let date = new Date();
                let nowDate = `${date.getFullYear()}${date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1}${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}`;
                const url = `${config.BAIDU_API_URL}?access_token=${config.BAIDU_ACCESS_TOKEN}&site_id=${config.BAIDU_TONGJI_SITE_ID}&method=overview/getTimeTrendRpt&start_date=${nowDate}&end_date=${nowDate}&metrics=pv_count,visitor_count`;
                const options = {
                    success (res) 
                    {
                        console.log(res.result);
                        if (res.result.error_code && res.result.error_code === '123')
                        {
                            // token过期需要重新获取，这里不进行获取,采用手动更新一个月更新一次
                            data.tongjiInfo = null;
                            return;
                        }
                        let items = res.result.items[1];
                        data.tongjiInfo = {
                            pv:0,
                            uv:0
                        };
                        for (let i = 0; i < items.length; i++)
                        {
                            if (items[i][0] !== '--')
                            {
                                data.tongjiInfo.pv += items[i][0];
                            }
                            if (items[i][1] !== '--')
                            {
                                data.tongjiInfo.uv += items[i][1];
                            }
                        }

                    },
                    loaded () 
                    {
                        console.log("data is loaded");
                    }
                };

                jsonp(url, options);

            }
        };

        onMounted(() => 
        {
            if (import.meta.env.VITE_NODE_ENV !== 'client') methods.getBaiduData();
        });
        return {
            ...toRefs(data),
            ...methods,
            checkIsClientEnv
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
    background-color: var(--el-bg-color);
    box-shadow: 0px 0px 4px 4px var(--el-shadow-nav);

    div {
        font-size: 14px;
        color: #808080;
        gap: 15px;
    }
}
</style>
