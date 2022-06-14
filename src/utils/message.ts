import { ElMessage } from 'element-plus';
// 二次封装el-message组件
const messageType:string[] = ['success', 'warning', 'error'];
const operation = (type:any) =>
{
    return function (value:any)
    {
        ElMessage({
            type:type,
            message:value,
            customClass:'z-message'
        });
    };
    
};
const message:any = {};

messageType.forEach((item) => 
{
    message[item] = operation(item);
});

export default message;