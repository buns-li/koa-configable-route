const nunjucks = require('nunjucks')

const Koa = require('koa')

const path = require('path')

const app = new Koa()

const middleware = require('../index')

function render(root, opts) {

    root = root || path.join(__dirname, './views')

    let env = nunjucks.configure(root, opts)

    env.addGlobal('env', process.env.NODE_ENV || 'dev')

    return (ctx, next) => {
        if (!ctx.render) {
            ctx.render = (view, context = {}) => {
                let template = view + '.html'
                return new Promise((resolve, reject) => {
                    env.render(template, context, (err, res) => err ? reject(err) : resolve(res))
                })
            }
        }
        return next()
    }
}

app.use(render())

app.use(middleware({
    ctrlRoot: path.join(__dirname, './controller/'),
    proxy: {
        host: 'coding.net',
        headers: {
            '__bbh_agent': 'MicroMessenger'
        },
        time: true
    },
    routes: [

        {
            path: '/weather',
            ctrls: [

                {
                    renderName: 'weather',
                    type: 'remote',
                    proxy: {
                        host: 'v.juhe.cn',
                        url: '/weather/index?format=2&cityname=%E8%8B%8F%E5%B7%9E&key=JHf55348f7f622552ff69cc1471ba5e4f8',
                        qs: 'user.getAccountEmail'
                    }
                }

            ]
        }
    ]
}))


app.use(async(ctx, next) => {
    ctx.throw(404, 'Not Found')
})

module.exports = app.listen()