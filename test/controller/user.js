exports.getAddressCodeQuery = function(ctx) {
    return {
        uid: ctx.params.id
    }
}

exports.getAccountEmail = function(ctx) {
    return {
        key: 'buns.zpli@gmail.com'
    }
}