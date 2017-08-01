# koa-configable-route

> a configable route middleware of koa.js

# Install

```sh
$ npm i --save koa-configable-route 
```

# Config Options

*  `ctrlRoot`: [`String`] 控制器所在目录的绝对地址 *Optional*
*  `proxy`: [`Object`]路由代理全局配置
    *  `protocol`:[`String`] http or https (Default:`http`)
    *  `host`: [`String`] 主机名
    *  `port`: [`Number`] 端口号
    *  `headers`:[`Object`] 代理请求头
*  `routes`: [`Array`] 所有路由配置
    *  `path`:[`String|RegExp`] 路由地址 demo: /users,/users/:id
    *  `method`:[`String|Array`] GET | POST | PUT | DELETE | HEAD | OPTIONS  (Default:`GET`)
    *  `view`:[`String`] 视图路径地址--基于viewRoot的地址
    *  `ctrls`:[`Array`] 控制器
        *   `renderName`:[`String`] 数据对应的身份名称
        *   `type`: [`String`] 控制器类型 remote、local(Default:`local`)
        *   `path`: [`String`] 控制器调用位置 格式:`user.m1`
        *   `proxy`:[Object`] 控制器的远程代理对象
            *  `host`: [`String`] 主机名
            *  `port`: [`Number`] 端口号
            *  `headers`:[`String|Object|Function`] 代理请求头
            *  `form`: [`String|Object|Function`] post请求的表单数据
            *  `formData`:[`String|Object|Function`] post带文件请求的表单数据
            *  `qs`: [`String|Object|Function`] query查询存储对象
            *  `params`:[`String|Number|Function`] 地址栏参数占位符的内容替换对象
    *  `subs`: [`Array`] 组路由下的子路由
        *   `path`:[`String`] 子路由--基于组路由 **Required**
        *   `method`:[`String`] GET | POST | PUT | DELETE | HEAD | OPTION (Default:`GET`)
        *   `view`:[`String`] 视图路径地址--基于viewRoot的地址 **Optional**
        *   `ctrls`:[`Array`] 控制器
            *  `type`: [`String`] 控制器类型 `remote`、`local`,如果是`remote`,那么`proxy`配置项必须设置,反之`path`设置必须设置(Default:`local`)
            *  `path`: [`String`] 控制器调用位置 格式:`控制器类名称.控制器待调用的方法名称`
            *  `proxy`:[Object`] 控制器的远程代理对象
                *   `host`: [`String`] 主机名
                *   `port`: [`Number`] 端口号
                *   `headers`:[`Object`] 代理请求头
                *   `form`: [`String|Object|Function`] post请求的表单数据
                *   `formData`:[`String|Object|Function`] post带文件请求的表单数据
                *   `qs`: [`String|Object|Function`] query查询存储对象

```javascript

const Koa = require('koa')

const app = new Koa()

const configableRoute = require('koa-configable-route')

app.use(configableRoute(
    {
        ctrlRoot: path.join(__dirname, './controller/'),
        proxy: {
            host: 'v.juhe.cn',
            headers: {
            },
            time: true
        },
        routes: [
            {
                path: '/weather',
                ctrls:
                [

                    {
                        renderName: 'weather',
                        type: 'remote',
                        proxy: {
                            url: '/weather/index',
                            qs: {
                                format:2,
                                cityname:'%E8%8B%8F%E5%B7%9E',
                                key:'JHf55348f7f622552ff69cc1471ba5e4f8'
                            }
                        }
                    }

                ]
            }
        ]
    }
))

```


# Hooks
> 配置钩子

1.可以允许使用钩子的配置项

* `headers` : http请求头

* `params` : 请求url中占位符的参数获取

* `qs` : get请求时url后的seach参数获取

* `form` : post等`application/x-www-form-urlencoded`类型的远程请求时的数据获取

* `formData` : post等`multipart/form-data`类型的远程请求时的数据获取


2.钩子类型

* `Function`: 直接在全局配置中声明钩子函数

```javascript
{
    headers: function(ctx){
        ctx.set('X-Flag','Test')
    }
}
```

* `ControlMethodFlag`: 控制器方法标识字符串

格式: `控制器类名.控制器类方法名称`


* `Object`: 直接声明静态键值对

```javascript
{
    headers:{
        'x-flag':'Test'
    }
}
```