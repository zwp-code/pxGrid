import { NAME } from './config';

export function logError (msg = '') 
{
    throw new Error(`${NAME}：${msg}`);
}

export function log (msg = '') 
{
    console.log(`${NAME}：${msg}`);
}
