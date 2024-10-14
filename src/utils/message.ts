import { ElMessage } from 'element-plus';
// 二次封装el-message组件
const messageType:string[] = ['success', 'warning', 'error', 'info'];
interface options {
    dangerouslyUseHTMLString?:boolean,
    center?:boolean,
    showClose?:boolean,
    grouping?:boolean,
    duration?:number,
    icon?:any,
    offset?:number
}
const operation = (type:any) =>
{
    return function (value:any, options:options)
    {
        ElMessage({
            type:type,
            message:value,
            customClass:'z-message',
            ...options
        });
    };
    
};
const message:any = {};

messageType.forEach((item) => 
{
    message[item] = operation(item);
});

export default message;