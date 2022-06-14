// let localStorageKeys:string[] = ['token', 'uid', 'un', 'pwd'];
let KeyPrefix:string = 'star-'; // 键前缀
let localkeys:string[] = ['token', 'uid', 'un', 'pwd'];
let sessionkeys:string[] = [];

interface operations {
    key?:string,
    get:()=>any,
    set:(value:string)=>any,
    remove:()=>any
}
// 操作
let operation:operations =
{
    get ()
    {
        const key = `${KeyPrefix}${this.key}`;
        return window.localStorage.getItem(key);
    },
    set (value)
    {
        const key = `${KeyPrefix}${this.key}`;
        // if(this.key === 'app')
        // {
        //     return window.localStorage.setItem(key, JSON.stringify(value));
        // }
        window.localStorage.setItem(key, value);
    },
    remove ()
    {
        const key = `${KeyPrefix}${this.key}`;
        window.localStorage.removeItem(key);
    }
};

// 操作
let operation1:operations =
{
    get ()
    {
        const key = `${KeyPrefix}${this.key}`;
        return window.sessionStorage.getItem(key);
    },
    set (value)
    {
        const key = `${KeyPrefix}${this.key}`;
        window.sessionStorage.setItem(key, value);
    },
    remove ()
    {
        const key = `${KeyPrefix}${this.key}`;
        window.sessionStorage.removeItem(key);
    }
};

let CacheService:any = {};

localkeys.forEach((key) =>
{
    CacheService[key] =
      {
          key,
          ...operation
      };
});
sessionkeys.forEach((key) =>
{
    CacheService[key] =
    {
        key,
        ...operation1
    };
});

export default CacheService;