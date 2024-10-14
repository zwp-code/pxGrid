import message from '@/utils/message';
/**
 * 转16进制
 * @param obj
 * @returns {*}
 */
export function rgbaToHex (arr) 
{
    // let [r, g, b, a] = arr;
    if (!arr.length) return '异常错误';
    let r = Math.round(arr[0]);
    let g = Math.round(arr[1]);
    let b = Math.round(arr[2]);
    let a = Math.round(arr[3] * 255);
  
    let hexR = r.toString(16).padStart(2, '0');
    let hexG = g.toString(16).padStart(2, '0');
    let hexB = b.toString(16).padStart(2, '0');
    let hexA = a.toString(16).padStart(2, '0');
  
    return `#${hexR}${hexG}${hexB}${hexA}`;
}


export function extractRgbaValues (rgbaString) 
{
    const regex = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/;
    const matches = rgbaString.match(regex);
    if (matches) 
    {
        console.log(matches);
        return [
            parseInt(matches[1]),
            parseInt(matches[2]),
            parseInt(matches[3]),
            parseFloat(matches[4])
        ];
        
    }
    return [];
}

export function isHexColor (color) 
{
    const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
    return hexColorRegex.test(color);
}


export function formatTime (value:any) 
{
    // 通过时间戳转字符串或者获取时间字符串
    let date = value ? new Date(value) : new Date();
    let yy = date.getFullYear();
    let mm = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    let dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    let hh = date.getHours() < 10 ? '0' +  date.getHours() : date.getHours();
    let mf = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    let ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return yy + '-' + mm + '-' + dd + ' ' + hh + ':' + mf + ':' + ss;
}

export function copyText (text)
{
    if (text.trim() === '') return;
    if (text === '异常错误') return message.error('复制失败');
    let input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    message.success('复制成功');
    document.body.removeChild(input);
}