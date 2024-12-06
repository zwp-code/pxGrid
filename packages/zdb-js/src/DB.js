import Dep from './uitils/Dep.js';
import { logError } from './uitils/log';
import { indexedDB, IDBTransaction, IDBKeyRange } from './global';
import { isArray, isObject } from './uitils/type.js';

class DB 
{
    constructor ({ dbName, version }) 
    {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.idb = null;
        this.table = [];
        this._status = false; // 是否先添加了表
        this._dep_ = new Dep();
    }

    /**
     * 打开数据库
     * @success 成功的回调，返回db，非必传
     * @error 失败的回调，返回错误信息，非必传
     * */
    open (ops) 
    {
      let success = () => {},
        error = () => {};

      if (ops) {
        success = ops.success ? ops.success : success;
        error = ops.error ? ops.error : error;
      }

      // 打开前要先添加表
      if (this.table.length == 0 && !this._status) {
        logError('打开前要先用add_table添加表');
        return;
      }

      if (typeof success !== 'function') {
        logError('open中success必须是一个function类型');
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = e => {
        error(e.currentTarget.error.message);
      };

      request.onsuccess = e => {
        this.db = e.target.result;
        // console.log(this.__create_transaction('pixelGrid', 'readwrite').getIndex('id'));
        success(this.db);
        this._dep_.notify();
      };

      request.onupgradeneeded = e => {
        this.idb = e.target.result;
        // console.log(this.idb.getObjectStore('pixelGrid'));
        for (let i = 0; i < this.table.length; i++) {
          this.__create_table(this.idb, this.table[i]);
        }
      };
    }

    //  关闭数据库
    close_db() {
      const handler = () => {
        this.db.close();
      };

      this.__action(handler);
    }

    // 删除数据库
    delete_db() {
      indexedDB.deleteDatabase(name);
    }

    //清空某张表的数据
    clear_table({ tableName }) {
      this.__action(() =>
        this.__create_transaction(tableName, 'readwrite').clear()
      );
    }

    /**
     * 添加一张表
     * @param tableOption<Object>
     * @tableName 表名
     * @option 表配置
     * @index 索引配置
     * */
    add_table(tableOption = {}) {
      this._status = false;
      this.table.push(tableOption);
    }

    /**
     * @method 查询某张表的所有数据
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} [success] @return {Array} 查询成功的回调，返回查到的结果
     * */
    queryAll({ tableName, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('queryAll方法中success必须是一个Function类型');
        return;
      }

      const handler = () => {
        const res = [];

        this.__create_transaction(
          tableName,
          'readonly'
        ).openCursor().onsuccess = e =>
          this.__cursor_success(e, {
            condition: () => true,
            handler: ({ currentValue }) => res.push(currentValue),
            over: () => success(res)
          });
      };

      this.__action(handler);
    }

    /**
     * @method 查询通过游标
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} condition 查询的条件
     *      @arg {Object} 遍历每条数据，和filter类似
     *      @return 条件
     *   @property {Function} [success] @return {Array} 查询成功的回调，返回查到的结果
     * */
    query_by_cursor({ tableName, condition, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      if (typeof condition !== 'function') {
        logError('in query,condition is required,and type is function');
        return;
      }
      const handler = () => {
        let res = [];

        this.__create_transaction(
          tableName,
          'readonly'
        ).openCursor().onsuccess = e =>
          this.__cursor_success(e, {
            condition,
            handler: ({ currentValue }) => res.push(currentValue),
            over: () => success(res)
          });
      };

      this.__action(handler);
    }

    // 分页+游标
    queryPage_by_cursor({ tableName, condition, page, pageSize, success = () => {} }) 
    {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      if (typeof condition !== 'function') {
        logError('in query,condition is required,and type is function');
        return;
      }
      const handler = () => 
      {
        let res = [];
        let counter = 0;
        let cursor;

        this.__create_transaction(
          tableName,
          'readonly'
        ).openCursor().onsuccess = (e) =>
        {
          cursor = e.target.result;
          if (cursor) 
          {
            const currentValue = cursor.value;
            if (condition(currentValue))
            {
              if (counter >= pageSize * (page - 1) && counter < pageSize * page) 
              {
                res.push(currentValue);
              }
              counter++;
              if (counter < pageSize)
              {
                cursor.continue();
              }
              else
              {
                cursor = null;
                success(res);
              }
            }
            else
            {
              if (counter >= pageSize * (page - 1) && counter < pageSize * page) 
              {
                res.push(cursor.value);
              }
              counter++;
              if (counter < pageSize)
              {
                cursor.continue();
              }
              else
              {
                cursor = null;
                success(res);
              }
            }
          } 
          else 
          {
            success(res);
          }
        }
          // this.__cursor_success(e, {
          //   condition,
          //   handler: ({ currentValue }) => res.push(currentValue),
          //   over: () => success(res)
          // });
      };

      this.__action(handler);
    }

    /**
     * @method 增加数据
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Object} data 插入的数据
     *   @property {Function} [success] 插入成功的回调
     * */
    insert({ tableName, data, success = () => {} }) {
      if (!(isArray(data) || isObject(data))) {
        logError('in insert，data type is Object or Array');
        return;
      }

      if (typeof success !== 'function') {
        logError('insert方法中success必须是一个Function类型');
        return;
      }

      this.__action(() => {
        const store = this.__create_transaction(tableName, 'readwrite');
        isArray(data) ? data.forEach(v => store.add(v)) : store.add(data);
        // this.__create_transaction(tableName, 'readwrite').add(data);
        success();
      });
    }


    /**
     * @method 删除数据
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} condition 查询的条件，遍历，与filter类似
     *      @arg {Object} 每个元素
     *      @return 条件
     *   @property {Function} [success] 删除成功的回调  @return {Array} 返回被删除的值
     *   @property {Function} [error] 错误函数 @return {String}
     * */
    delete({ tableName, condition, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('delete方法中success必须是一个Function类型');
        return;
      }

      if (typeof condition !== 'function') {
        logError('in delete,condition is required,and type is function');
        return;
      }

      const handler = () => {
        let res = [];

        this.__create_transaction(
          tableName,
          'readwrite'
        ).openCursor().onsuccess = e =>
          this.__cursor_success(e, {
            condition,
            handler: ({ currentValue, cursor }) => {
              res.push(currentValue);
              cursor.delete();
            },
            over: () => {
              if (res.length == 0) {
                logError(`in delete ,数据库中没有任何符合condition的元素`);
                return;
              }
              success(res);
            }
          });
      };

      this.__action(handler);
    }

    /**
     * @method 删除数据(主键)
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String\|Number} target 目标主键值
     *   @property {Function} [success] 删除成功的回调  @return {Null}
     * */
    delete_by_primaryKey({
      tableName,
      target,
      success = () => {},
      error = () => {}
    }) {
      if (typeof success !== 'function') {
        logError('in delete_by_primaryKey，success必须是一个Function类型');
        return;
      }

      this.__action(() => {
        const request = this.__create_transaction(tableName, 'readwrite').delete(
          target
        );
        request.onsuccess = (e) => success(e);
        request.onerror = (e) => error(e);
      });
    }

    /**
     * @method 修改某条数据(主键)
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String\|Number} target 目标主键值
     *   @property {Function} handle 处理函数，接收本条数据的引用，对其修改
     *   @property {Function} [success] 修改成功的回调   @return {Object} 返回被修改后的值
     * */
    update_by_primaryKey({ tableName, target, handle, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('in update_by_primaryKey，success必须是一个Function类型');
        return;
      }
      if (typeof handle !== 'function') {
        logError('in update_by_primaryKey，handle必须是一个Function类型');
        return;
      }

      this.__action(() => {
        const store = this.__create_transaction(tableName, 'readwrite');
        store.get(target).onsuccess = e => {
          const currentValue = e.target.result;
          if (currentValue)
          {
            handle(currentValue);
            store.put(currentValue);
          }
          else
          {
            // 不存在
            // store.add([]);
            success(null);
          }
          success(currentValue);
        };
      });
    }

    /**
     * @method 修改数据
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Function} condition 查询的条件，遍历，与filter类似
     *      @arg {Object} 每个元素
     *      @return 条件
     *   @property {Function} handle 处理函数，接收本条数据的引用，对其修改
     *   @property {Function} [success] 修改成功的回调，返回修改成功的数据   @return {Array} 返回被修改后的值
     * */
    update({ tableName, condition, handle, success = () => {} }) {
      if (typeof handle !== 'function') {
        logError('in update,handle必须是一个function类型');
        return;
      }

      if (typeof success !== 'function') {
        logError('in update,success必须是一个function类型');
        return;
      }

      if (typeof condition !== 'function') {
        logError('in update,condition is required,and type is function');
        return;
      }

      const handler = () => {
        let res = [];

        this.__create_transaction(
          tableName,
          'readwrite'
        ).openCursor().onsuccess = e =>
          this.__cursor_success(e, {
            condition,
            handler: ({ currentValue, cursor }) => {
              handle(currentValue);
              res.push(currentValue);
              cursor.update(currentValue);
            },
            over: () => {
              if (res.length == 0) {
                logError(`in update ,数据库中没有任何符合condition的元素`);
                return;
              }
              success(res);
            }
          });
      };
      this.__action(handler);
    }

    /**
     * @method 查询数据（主键值）
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Number|String} target 主键值
     *   @property {Function} [success] 查询成功的回调，返回查询成功的数据   @return {Object} 返回查到的结果
     *
     * */
    query_by_primaryKey({ tableName, target, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('in query_by_primaryKey,success必须是一个Function类型');
        return;
      }
      const handleFn = () => {
        this.__create_transaction(tableName, 'readonly').get(
          target
        ).onsuccess = e => {
          const result = e.target.result;
          success(result || null);
        };
      };
      this.__action(handleFn);
    }

    /**
     * @method 查询数据（索引）顺序
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Number|String} indexName 索引名
     *   @property {Number|String} target 索引值
     *   @property {Function} [success] 查询成功的回调，返回查询成功的数据   @return {Object} 返回查到的结果
     *
     * */
    query_by_index({ tableName, indexName, target, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('in query_by_index,success必须是一个Function类型');
        return;
      }
      const handleFn = () => {
        this.__create_transaction(tableName, 'readonly')
          .index(indexName)
          .get(target).onsuccess = e => {
          const result = e.target.result;
          success(result || null);
        };
      };
      this.__action(handleFn);
    }

    /**
     * @method 查询数据（索引）倒序
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {Number|String} indexName 索引名
     *   @property {Number|String} target 索引值
     *   @property {Function} [success] 查询成功的回调，返回查询成功的数据   @return {Object} 返回查到的结果
     *
     * */
     query_by_index_prev({ tableName, indexName, indexValue, success = () => {} }) {
      if (typeof success !== 'function') {
        logError('in query_by_index,success必须是一个Function类型');
        return;
      }
      const handleFn = () => {
        this.__create_transaction(tableName, 'readonly')
          .index(indexName).openCursor(IDBKeyRange.only(indexValue), 'prev')
          .onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
              const currentValue = cursor.value;
              success(currentValue || null)
            } else {
              success(null);
            }
            // success(result || null);
        };
      };
      this.__action(handleFn);
    }

    /**
     * @method 游标开启成功,遍历游标
     * @param {Function} 条件
     * @param {Function} 满足条件的处理方式 @arg {Object} @property cursor游标 @property currentValue当前值
     * @param {Function} 游标遍历完执行的方法
     * @return {Null}
     * */
    __cursor_success(e, { condition, handler, over }) {
      const cursor = e.target.result;
      if (cursor) {
        const currentValue = cursor.value;
        if (condition(currentValue)) handler({ cursor, currentValue });
        cursor.continue();
      } else {
        over();
      }
    }

    /**
     * @method 开启事务
     * @param {String} 表名
     * @param {String} 事务权限
     * @return store
     * */
    __create_transaction(tableName, mode = 'readwrite') {
      if (!tableName || !mode) {
        throw new Error('in __create_transaction,tableName and mode is required');
      }
      const transaction = this.db.transaction(tableName, mode);
      return transaction.objectStore(tableName);
    }

    // db是异步的,保证fn执行的时候db存在
    __action(handler) {
      const action = () => {
        handler();
      };
      // 如果db不存在，加入依赖
      if (!this.db) {
        this._dep_.add(action);
      } else {
        action();
      }
    }

    /**
     * 创建table
     * @option<Object>  keyPath指定主键 autoIncrement是否自增
     * @index 索引配置
     * */
    __create_table (idb, { tableName, option, indexs = [] }) 
    {
        if (!idb.objectStoreNames.contains(tableName)) 
        {
            let store = idb.createObjectStore(tableName, option);
            for (let indexItem of indexs) {
              this.__create_index(store, indexItem);
            }
        }
        // else
        // {
        //   const objectStore = this.__create_transaction(tableName, 'readwrite');
        //   for (let indexItem of indexs) {
        //     if (!objectStore.getIndex(indexItem.key))
        //     {
        //       // 新建索引
        //       this.__create_index(objectStore, indexItem);
        //     }
        //   }

        // }
    }

    /**
     * 创建索引
     * @option<Object> unique是否是唯一值
     * */
    __create_index(store, { key, option, value }) {
        console.log('创建索引');
        if (key === 'topTimeIndex')
        {
          // 创建复合索引
          store.createIndex(key, value, option);
        }
        else
        {
          store.createIndex(key, key, option);
        }
    }

    /**
     * 通过索引和游标查询
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String} indexName 索引名
     *   @property {String} indexValue 索引对应的值
     *   @property {Function} [success] @return {Array} 查询成功的回调，返回查到的结果
    */
    query_by_cursor_index ({ tableName, indexName, indexValue, success = () => {}}) {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      const handler = () => {
        let res = [];

        this.__create_transaction(
          tableName,
          'readonly'
        ).index(indexName).openCursor(IDBKeyRange.only(indexValue)).onsuccess = e =>
          {
            const cursor = e.target.result;
            if (cursor) {
              const currentValue = cursor.value;
              res.push(currentValue);
              cursor.continue();
            } else {
              success(res);
            }
          }
      };
      this.__action(handler);
    }
    
    /**
     * 通过索引和游标删除
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String} indexName 索引名
     *   @property {String} indexValue 索引对应的值
     *   @property {Function} [success] @return {Array} 成功的回调
    */
    delete_by_cursor_index ({ tableName, indexName, indexValue, success = () => {}}) {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      const handler = () => {

        this.__create_transaction(
          tableName,
          'readwrite'
        ).index(indexName).openCursor(IDBKeyRange.only(indexValue)).onsuccess = e =>
          {
            const cursor = e.target.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              success();
            }
          }
      };
      this.__action(handler);
    }

    /**
     * 通过索引删除
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String} indexName 索引名
     *   @property {String} indexValue 索引对应的值
     *   @property {Function} [success] @return {Array} 成功的回调
    */
     delete_by_index ({ tableName, indexName, indexValue, success = () => {}}) {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      const handler = () => {

        this.__create_transaction(
          tableName,
          'readwrite'
        ).index(indexName).openCursor(IDBKeyRange.only(indexValue)).onsuccess = e =>
          {
            const cursor = e.target.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              success();
            }
          }
      };
      this.__action(handler);
    }
    
    /**
     * 通过索引和游标查询分页
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String} indexName 索引名
     *   @property {String} indexValue 索引对应的值
     *   @property {Number} page 页码
     *   @property {Number} pageSize 查询条数 
     *   @property {String} sort 排序
     *   @property {Function} [success] @return {Array} 查询成功的回调，返回查到的结果
    */
    queryPage_by_cursor_index ({ tableName, indexName, indexValue, page, pageSize, sort = "next", success = () => {}}) {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      const handler = () => {
        let res = [];
        let counter = 0; // 计数器
        let advanced = true; // 是否跳过多少条查询
        let store = this.__create_transaction(
          tableName,
          'readonly'
        );
        let request = store.index(indexName).openCursor(IDBKeyRange.only(indexValue), sort)
        request.onsuccess = e =>
        {
          let cursor = e.target.result;
          // if (page > 1 && advanced) {
          //   advanced = false;
          //   cursor.advance((page - 1) * pageSize); // 跳过多少条
          //   return;
          // }

          if (cursor)
          {
            if (page > 1 && advanced) {
              advanced = false;
              cursor.advance((page - 1) * pageSize); // 跳过多少条
              return;
            }
            res.push(cursor.value)
            counter++;
            if (counter < pageSize) {
              cursor.continue(); // 遍历了存储对象中的所有内容
            } else {
              cursor = null;
              success(res);
            }
          } else {
            success(res);
          }
        };
        request.onerror = e => 
        {
          console.log(e);
        }
      };
      this.__action(handler);
    }

    /**
     * 通过索引和游标 不同类型 查询分页
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String} indexName 索引名
     *   @property {String} indexValue 索引对应的值
     *   @property {Number} page 页码
     *   @property {Number} pageSize 查询条数 
     *   @property {String} sort 排序
     *   @property {String} type 类型
     *   @property {Function} [success] @return {Array} 查询成功的回调，返回查到的结果
    */
     queryPage_by_type_cursor_index (
       { 
         tableName, 
         indexName, 
         indexValue, 
         page, 
         pageSize, 
         sort = "next",
         type,
         success = () => {}
        }) 
      {
      if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
      }

      const handler = () => {
        let res = [];
        let counter = 0; // 计数器
        let advanced = true; // 是否跳过多少条查询
        let store = this.__create_transaction(
          tableName,
          'readonly'
        );
        let request = store.index(indexName).openCursor(IDBKeyRange.only(indexValue), sort)
        request.onsuccess = e =>
        {
          let cursor = e.target.result;

          if (cursor)
          {
            if (page > 1 && advanced) {
              advanced = false;
              cursor.advance((page - 1) * pageSize); // 跳过多少条
              return;
            }
            if (type === 'all')
            {
              res.push(cursor.value)
            }
            else
            {
              if (cursor.value.data.type === type)
              {
                res.push(cursor.value)
              }
            }
            counter++;
            if (counter < pageSize) {
              cursor.continue(); // 遍历了存储对象中的所有内容
            } else {
              cursor = null;
              success(res);
            }
          } else {
            success(res);
          }
        };
        request.onerror = e => 
        {
          console.log(e);
        }
      };
      this.__action(handler);
    }

    /**
     * 通过索引和游标 不同类型 查询
     * @param {Object}
     *   @property {String} tableName 表名
     *   @property {String} indexName 索引名
     *   @property {String} indexValue 索引对应的值
     *   @property {String} sort 排序
     *   @property {String} type 类型
     *   @property {Function} condition 查询的条件
     *      @arg {Object} 遍历每条数据，和filter类似
     *      @return 条件
     *   @property {Function} [success] @return {Array} 查询成功的回调，返回查到的结果
    */
     query_by_type_cursor_index (
      { 
        tableName, 
        indexName, 
        indexValue,
        sort = "next",
        type,
        condition,
        success = () => {}
       }) 
     {
     if (typeof success !== 'function') {
        logError('query方法中success必须是一个Function类型');
        return;
     }

     if (typeof condition !== 'function') {
        logError('in query,condition is required,and type is function');
        return;
    }

     const handler = () => {
       let res = [];
       let store = this.__create_transaction(
          tableName,
          'readonly'
       );
       let request = store.index(indexName).openCursor(IDBKeyRange.only(indexValue), sort)
       request.onsuccess = e =>
       {
          this.__cursor_success(e, {
            condition,
            handler: ({ currentValue }) => { 
              if (type === 'all')
              {
                res.push(currentValue)
                return;
              }
              if (currentValue.data.type === type)
              {
                res.push(currentValue)
              }
            },
            over: () => success(res)
          });
       };
       request.onerror = e => 
       {
          console.log(e);
       }
     };
     this.__action(handler);
   }
    

}

export default DB;
