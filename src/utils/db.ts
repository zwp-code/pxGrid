import Zdb from '../../packages/zdb-js/src/Zdb.js';
import db from '@/config/db';
const $zdb = Zdb(db);
const $DB = {
    findDB (id, tableName = 'pixelGrid')
    {
        return new Promise((resolve, reject) => 
        {
            $zdb.then((res) => 
            {
                res.query_by_cursor_index({
                    tableName,
                    indexName:'id',
                    indexValue:id,
                    success: async (res1) => 
                    {
                        resolve(res1);
                    }
                });
            }, 
            (err) => 
            {
                reject(err);
                console.error('读取数据失败' + err.message);
            });
        });
    },
    findAllDB (tableName = 'pixelGrid')
    {
        return new Promise((resolve, reject) => 
        {
            $zdb.then((res) => 
            {
                res.queryAll({
                    tableName,
                    success: async (res1) => 
                    {
                        console.log(res1);
                        resolve(res1);
                    }
                });
            }, 
            (err) => 
            {
                reject(err);
                console.error('读取数据失败' + err.message);
            });
        });
    },
    exportDB (id, tableName = 'pixelGrid')
    {
        // 导出某个备份数据
        return new Promise((resolve, reject) => 
        {
            $zdb.then((res1) => 
            {
                res1.query_by_cursor_index({
                    tableName,
                    indexName:'id',
                    indexValue:id,
                    success: async (res) => 
                    {
                        if (!res.length)
                        {
                            return reject(new Error('暂无数据可导出'));
                        }
                        resolve(res);
                    }
                });
            }, 
            (err) => 
            {
                reject(err);
            });
        });
    },
    
    clearDB (key, tableName = 'pixelGrid')
    {
        return new Promise((resolve, reject) => 
        {
            $zdb.then((res) => 
            {
                res.delete_by_index({
                    tableName,
                    indexName:'id',
                    indexValue:key,
                    success:() => 
                    {
                        console.log('删除成功');
                        resolve(true);
                    }
                });
            },
            (err) => 
            {
                console.error('删除失败' + err); 
                reject(err);
            });
        });
    },
    updateDB (value, tableName = 'pixelGrid')
    {
        let valueData = JSON.parse(JSON.stringify(value));
        // 修改
        return new Promise((resolve, reject) => 
        {
            $zdb.then((res) => 
            {
                res.update({
                    tableName,
                    condition:(item) => item.id === valueData.id,
                    handle: (r) => 
                    {
                        r.data = valueData.data; 
                    },
                    success:(res) => 
                    {
                        resolve(true);
                    }
                });
            },
            (err) => 
            {
                console.error('修改失败' + err); 
                reject(err);
            });
        });
    },

    saveDB (key, value, tableName = 'pixelGrid')
    {
        let valueData = JSON.parse(JSON.stringify(value));
        return new Promise((resolve, reject) => 
        {
            // 导入数据
            $zdb.then((res) => 
            {
                res.insert({
                    tableName,
                    data:{
                        id:key,
                        data:valueData
                    },
                    success:() => 
                    {
                        resolve(true);
                    }
                });
            }, 
            (err) => 
            {
                console.error('保存异常' + err.message);
                reject(err);
            });
            
        });
    }
};

export default $DB;