import message from '@/utils/message';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { addListener, launch, stop, setDetectDelay } from 'devtools-detector';
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
    return `#${hexR}${hexG}${hexB}${hexA}`.toLowerCase();
}

export function hexToRgba (hex) 
{
    let r = 0, g = 0, b = 0, a = 255;
    if (hex.length === 6) 
    {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } 
    else if (hex.length === 7) 
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


export function extractRgbaValues (colorString) 
{
    let rgbaString = colorString;
    if (isHexColor(rgbaString)) return hexToRgba(rgbaString);
    const regex = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/;
    console.log(rgbaString);
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

export function handleTransformColorAsHex (value)
{
    let color = value;
    return isHexColor(color) ? rgbaToHex(hexToRgba(color)) : rgbaToHex(extractRgbaValues(color));
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

export function isLastCharNumberWithRegex (str) 
{
    const regex = /\d$/;
    return regex.test(str);
}

export function isHexColor (color) 
{
    const hexWithAlphaRegex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;
    const hexWithoutAlphaRegex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;
    return hexWithAlphaRegex.test(color) || hexWithoutAlphaRegex.test(color);
}

export function isRgbaColor (color) 
{
    if (color.includes('rgb'))
    {
        return true;
    }
    return false;
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

export function downloadImageByDataURL (name, dataURL) 
{
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = name || 'pixel';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function exportImageForZip (filenamae, imgArr, type = 'png')
{
    const zip = new JSZip();
    for (let i = 0; i < imgArr.length; i++)
    {
        zip.file(`image${i}.${type}`, imgArr[i].split(',')[1], { base64: true });
    }
    zip.generateAsync({ type: 'blob' }).then(function (content) 
    {
        FileSaver.saveAs(content, `${filenamae}.zip`);
    });
}

export function downloadIamgeByUrl (url, name, type = 'image/png') // 外链下载
{
    // 下载图片地址和图片名
    let image = new Image();
    // 解决跨域 Canvas 污染问题
    image.setAttribute('crossOrigin', 'anonymous');
    image.onload = function () 
    {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context:any = canvas.getContext('2d');
        context.drawImage(image, 0, 0, image.width, image.height);
        const dataURL = canvas.toDataURL(type);
        const a = document.createElement('a'); 
        const event = new MouseEvent('click'); 
        a.download = name || 'photo';
        a.href = dataURL;
        a.dispatchEvent(event);
    };
    image.src = url;
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
    for (let i = 0; i < list.length - 1; i++)
    {
        for (let j = 0; j < list.length - 1 - i; j++)
        {
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

export function getFontColor (arg1?:any, arg2?:any, arg3?:any) 
{
    if (typeof arg1 == 'string' && arg1.length >= 6) 
    {
        let rgb = hexToRgba(arg1);
        return rgb[0] + rgb[1] + rgb[2] > 384 ? '#000' : '#FFF';// 浅色黑字，深色白字
    } 
    else if (typeof arg1 == 'number' && typeof arg2 == 'number' && typeof arg3 == 'number') 
    {
        return arg1 + arg2 + arg2 > 384 ? '#000' : '#FFF';
    }
    return null;
}

export function colorDistance (r1, g1, b1, r2, g2, b2) 
{
    let rmean = (r1 + r2) / 2,
        rd = r1 - r2,
        gd = g1 - g2,
        bd = b1 - b2;
    return (((512 + rmean) * rd * rd) >> 8) + 4 * gd * gd + (((767 - rmean) * bd * bd) >> 8);
}

export function measureTextHeight (width, height)
{
    let newHeight = height;
    if (width >= 40) return newHeight -= 8;
    if (width >= 35) return newHeight -= 7;
    if (width >= 30) return newHeight -= 6;
    if (width >= 25) return newHeight -= 5;
    if (width >= 20) return newHeight -= 4;
    if (width >= 15) return newHeight -= 3;
    return newHeight;
}


export const isObject = (data) => Object.prototype.toString.call(data) === '[object Object]';
export const isArray = (data) => Object.prototype.toString.call(data) === '[object Array]';


export function nearestNeighborCoordZoom (scaleAreaData, scaleRatio)
{
    let {
        minX,
        maxX,
        minY,
        maxY,
        realmaxX,
        realminX,
        realmaxY,
        realminY,
        colorMaxtrix,
        coordMaxtrix
    } = scaleAreaData;
    let originGridWidth = (maxX - minX) + 1;
    let originGridHeight = (maxY - minY) + 1;
    // let targetWidth = originGridWidth + scaleRatio;
    // let targetHeight = originGridHeight + scaleRatio;
    // let scaleX = targetWidth / originGridWidth;
    // let scaleY = targetHeight / originGridHeight;
    let scaledPixelMap = [] as any;
    if (scaleRatio >= 0)
    {
        for (let y = 0; y < coordMaxtrix.length; y++)
        {
            let newRow = [] as any;
            for (let x = 0; x < coordMaxtrix[y].length; x++)
            {
                let x1 = coordMaxtrix[y][x][0];
                let y1 = coordMaxtrix[y][x][1];
                newRow.push([x1, y1]);
            }
            // 为当前行添加新列（位于右侧的新点）
            let lastCoord = coordMaxtrix[y][coordMaxtrix[y].length - 1];
            for (let i = 1; i <= scaleRatio; i++) 
            {
                newRow.push([lastCoord[0] + i, lastCoord[1]]);
            }
            scaledPixelMap.push(newRow);
        }
        // 添加新行（位于底部的新点）
        for (let i = 1; i <= scaleRatio; i++) 
        {
            let lastRow = scaledPixelMap[scaledPixelMap.length - 1];
            let newBottomRow = [] as any;
            lastRow.forEach((coord) => 
            {
                newBottomRow.push([coord[0], coord[1] + 1]);
            });
            scaledPixelMap.push(newBottomRow);
        }
    }
    else
    {
        for (let y = 0; y < coordMaxtrix.length + scaleRatio; y++)
        {
            let newRow = [] as any;
            for (let x = 0; x < coordMaxtrix[y].length + scaleRatio; x++)
            {
                let x1 = coordMaxtrix[y][x][0];
                let y1 = coordMaxtrix[y][x][1];
                newRow.push([x1, y1]);
            }
            scaledPixelMap.push(newRow);
        }
    }
    
    return scaledPixelMap;
}


export function nearestNeighborColorZoom (scaleAreaData, scaleRatio)
{
    let {
        minX,
        maxX,
        minY,
        maxY,
        realmaxX,
        realminX,
        realmaxY,
        realminY,
        colorMaxtrix,
        coordMaxtrix
    } = scaleAreaData;
    let originGridWidth = (maxX - minX) + 1;
    let originGridHeight = (maxY - minY) + 1;
    let targetWidth = originGridWidth + scaleRatio;
    let targetHeight = originGridHeight + scaleRatio;
    let scaleX = targetWidth / originGridWidth;
    let scaleY = targetHeight / originGridHeight;
    let scaledPixelMap = [] as any;
    for (let i = 0; i < targetHeight; i++) 
    {
        scaledPixelMap.push([]);
        for (let j = 0; j < targetWidth; j++) 
        {
            scaledPixelMap[i].push('#00000000');
        }
    }
    for (let y = 0; y < targetHeight; y++)
    {
        for (let x = 0; x < targetWidth; x++)
        {
            let srcX = Math.floor(x / scaleX);
            let srcY = Math.floor(y / scaleY);

            scaledPixelMap[y][x] = colorMaxtrix[srcY][srcX];
        }
    }
    return scaledPixelMap;
}

export const monitorLog = () => 
{
    if (import.meta.env.VITE_NODE_ENV === 'production') 
    {
        (() => 
        {
            addListener((isOpen) => 
            {
                if (isOpen) 
                {
                    window.onbeforeunload = null;
                    window.location.href = 'https://baidu.com';
                }
            });
            launch();
        })();
    }
};

export const checkIsClientEnv = () => 
{
    if (import.meta.env.VITE_NODE_ENV === 'client') return true;
    return false;
};

export const getRequestUrl = () => 
{
    if (import.meta.env.VITE_NODE_ENV === 'client') return import.meta.env.VITE_APP_API_URL;
    return window.location.origin + '/';
};

export const checkDate = (type) => 
{
    let date = new Date().getTime();
    if (type === '圣诞')
    {
        if (date > 1734969601000 && date < 1735142399000) return true;
        return false;
    }
    else if (type === '公祭日')
    {
        if (date > 1734019201000 && date < 1734105601000) return true;
        return false;
    }
};

export function getScaleValue (element) 
{
    let style:any = window.getComputedStyle(element);
    let matrix = style.transform || style.webkitTransform || style.mozTransform;
    let values = matrix.split('(')[1].split(')')[0].split(',');
    let a = values[0];
    let b = values[1];
    // handle skew and rotation, which modify scale
    if (a * b < 0) 
    {
        a = -Math.sqrt(a * a + b * b);
    } 
    else 
    {
        a = Math.sqrt(a * a + b * b);
    }
    return a;
}