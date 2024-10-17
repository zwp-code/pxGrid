import screenfull from 'screenfull';
import message from '@/utils/message';
import { getCurrentInstance } from 'vue';
// 处理全屏
function fullScreen () 
{
    const { proxy }:any = getCurrentInstance();
    const ScreenFull = () => 
    {
        if (!screenfull.isEnabled) 
        {
            // 如果不支持进入全屏，发出不支持提示
            message.warning(proxy.$t('message.fullscreenError'));
            return false;
        }
        screenfull.toggle();
    };
    return { ScreenFull };
}

export default fullScreen;