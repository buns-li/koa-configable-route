const request = require('supertest')

const Should = require('should')

describe('GET', function() {

    let server

    beforeEach(function() {
        server = require('./server')
    })

    afterEach(function() {
        server.close()
    })

    it.skip('should render json', function(done) {

        request(server)
            .get('/weather')
            // .set('Accept', 'application/json')
            .expect('content-type', 'application/json; charset=utf-8')
            .expect(200, done)

    })

    it('should render html', function(done) {

        request(server)
            .get('/account/sign-in')
            // .set('Accept', 'application/json')
            .expect('content-type', 'text/html; charset=utf-8')
            .expect(200, done)

    })


})


// const pathToRegexp = require('path-to-regexp')


// let params = []

// console.log(pathToRegexp('/users/test_:id/:name', params))

// console.log(params)