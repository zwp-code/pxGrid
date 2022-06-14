import {
    Edit, Search, Lock, User, SwitchButton, ArrowDown, Headset,
    Loading, UserFilled, MoreFilled, ArrowRight, ArrowLeft, Files,
    FolderOpened, PictureRounded, Setting, Minus, Close, CopyDocument,
    Back, RefreshRight, Right, CirclePlus, Menu, Plus, CircleCheckFilled,
    CircleCloseFilled, Refresh, FullScreen, UploadFilled
} from '@element-plus/icons-vue'; // 图标需要分开导入，按需导入图标

// 注册图标组件
let iconComponent = [
    Edit, Search, Lock, User, SwitchButton, ArrowDown, Headset,
    Loading, UserFilled, MoreFilled, ArrowRight, ArrowLeft, Files,
    FolderOpened, PictureRounded, Setting, Minus, Close, CopyDocument,
    Back, RefreshRight, Right, CirclePlus, Menu, Plus, CircleCheckFilled,
    CircleCloseFilled, Refresh, FullScreen, UploadFilled
];
export const componentIcon = (app:any) => 
{
    iconComponent.forEach((item) =>
    {
        app.component(item.name, item);
    });
};
