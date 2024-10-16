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
    if (arr[3] > 1) arr[3] = arr[3] / 255;
    let a = Math.round(arr[3] * 255);
  
    let hexR = r.toString(16).padStart(2, '0');
    let hexG = g.toString(16).padStart(2, '0');
    let hexB = b.toString(16).padStart(2, '0');
    let hexA = a.toString(16).padStart(2, '0');
  
    return `#${hexR}${hexG}${hexB}${hexA}`;
}

export function hexToRgba (hex) 
{
    let r = 0, g = 0, b = 0, a = 255;
    if (hex.length === 7) 
    {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    } 
    else if (hex.length === 9) 
    {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
      a = parseInt(hex.slice(7, 9), 16);
    }
    // return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    return [r, g, b, a / 255];
}


export function extractRgbaValues (rgbaString) 
{
    if (isHexColor(rgbaString)) return hexToRgba(rgbaString);
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
    const hexWithAlphaRegex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;
    const hexWithoutAlphaRegex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;
    return hexWithAlphaRegex.test(color) || hexWithoutAlphaRegex.test(color);
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

export function getOrderedRectangleCoordinates (x0, y0, x1, y1)
{
    return {
        x0 : Math.min(x0, x1),
        y0 : Math.min(y0, y1),
        x1 : Math.max(x0, x1),
        y1 : Math.max(y0, y1)
    };
}

export function removeNullFrom2DArray (arr) 
{
    return arr.filter((subArr) => 
    {
        return subArr.every((item) => item !== null);
    });
}

export function unique2DArray (arr) 
{
    const uniqueSet = new Set(arr.map((item) => JSON.stringify(item)));
    const uniqueArr = Array.from(uniqueSet).map((item:any) => JSON.parse(item));
    return removeNullFrom2DArray(uniqueArr);
}