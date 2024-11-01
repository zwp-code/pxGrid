import message from '@/utils/message';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
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
  
    return `#${hexR}${hexG}${hexB}${hexA}`.toLocaleLowerCase();
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

export function getColumnsList (list, columnsNum = 2) 
{
    const arrObject = {};
    for (let i = 0; i < columnsNum; i++) 
    {
        arrObject[i] = []; // 创建空的对象数组
    }
    list.forEach((element, index) =>  arrObject[index % columnsNum].push(element));
    const cloGapList = [] as any;
    for (let key in arrObject) 
    {
        cloGapList.push(...arrObject[key]);
    }
    return cloGapList;
}

export function isHexColor (color) 
{
    const hexWithAlphaRegex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;
    const hexWithoutAlphaRegex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;
    return hexWithAlphaRegex.test(color) || hexWithoutAlphaRegex.test(color);
}

export function formatTime (value:any = new Date()) 
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

export function removeNullArray (arr) 
{
    return arr.filter((item) => 
    {
        return item !== null;
    });
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

export function generateIamge (width, height, imageData) 
{
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context:any = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    const url = canvas.toDataURL('image/png');
    return url;
}

export function downloadFile (data, type, filename) 
{
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`; // 设置下载文件名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


export function downloadImage (canvas, name) 
{
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = name || 'frame';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function exportImageForZip (filenamae, imgArr)
{
    const zip = new JSZip();
    for (let i = 0; i < imgArr.length; i++)
    {
        zip.file(`image${i}.png`, imgArr[i].split(',')[1], { base64: true });
    }
    zip.generateAsync({ type: 'blob' }).then(function (content) 
    {
        FileSaver.saveAs(content, `${filenamae}.zip`);
    });
}

// 转时间戳
export function formatTimeStamp (time?:any):number
{    
    if (!time)
    {
        return 0;
    }
    let date = time.replace(/-/g, '/');
    let timestamp = new Date(date).getTime();
    return timestamp;
}

export function sortList (list, key)
{
    console.log(list.length);
    
    if (list.length <= 1) return list;
    for (let j = 0; j < list.length; j++)
    {
        if (j + 1 >= list.length) break;
        if (list[j].data['isTop'] === list[j + 1].data['isTop'])
        {
            if (formatTimeStamp(list[j].data[key]) < formatTimeStamp(list[j + 1].data[key]))
            {
                let temp = list[j];
                list[j] = list[j + 1];
                list[j + 1] = temp;
            }
        }
        else if (list[j].data['isTop'] < list[j + 1].data['isTop'])
        {
            let temp = list[j];
            list[j] = list[j + 1];
            list[j + 1] = temp;
        }
    }
    console.log(list);
    
    return list;
}

export const base64ToBlob = (dataurl) => 
{
    let arr = dataurl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) 
    {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

export function blobToBase64 (blob) 
{
    return new Promise((resolve, reject) => 
    {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => 
        {
            resolve(reader.result);
        };
        reader.onerror = (e) => 
        {
            reject(e);
        };
    });
}
  
  