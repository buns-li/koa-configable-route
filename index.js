const Router = require('./lib/Router')

module.exports = function(options) {

    Router.init(options)

    return async(ctx, next) => {

        //获取匹配的路由对象---根据地址和方法
        let router = Router.find(ctx.path, ctx.method)

        if (!router) {
            return await next()
        }

        await router.flow(ctx)
    }
}