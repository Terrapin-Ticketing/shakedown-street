const { mongoose } = require('../_utils/bootstrap')
import redis from '../_utils/redis'

import User from '.'
const UserController = User.controller

import httpMocks from 'node-mocks-http'

describe('User', () => {
  afterEach(async() => {
    await mongoose.dropCollection('users')
  })

  afterAll(async() => {
    await redis.flushdb()
  })

  describe('controller', () => {
    it('should sign user up', async() => {
      let user = await UserController.createUser('test@email.com', 'testpass')
      expect(user).toBeTruthy()
    })

    it('should change users password', async() => {
      let user = await UserController.createUser('test@email.com', 'testpass')
      let newUser = await UserController.changePassword(user.email, 'newpass')
      let newPassword = newUser.password
      expect(newPassword).toBeDefined()
    })
  })

  describe('routes', () => {
    it('should create user by calling route', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: '/signup',
        body: {
          email: 'tesT@email.com',
          password: 'testpass'
        }
      })
      const mockRes = httpMocks.createResponse()

      await User.routes['/signup'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.token)
    })

    it('should not allow user update from different user', async() => {
      const user = await UserController.createUser('test@test.com', 'test')
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: `/users/${user._id}`,
        body: {
          'payout.default': 'venmo'
        },
        params: {
          id: user._id
        }
      })
      const mockRes = httpMocks.createResponse()

      await User.routes['/users/:id'].put(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBeTruthy()
    })

    it('should fail to sign up with invalid email', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: '/signup',
        body: {
          email: 'test',
          password: 'testpass'
        }
      })
      const mockRes = httpMocks.createResponse()

      await User.routes['/signup'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBeTruthy()
    })

    it('should log in existing user', async() => {
      await UserController.createUser('test@email.com', 'testpass')
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: '/login',
        body: {
          email: 'tesT@email.com',
          password: 'testpass'
        }
      })
      const mockRes = httpMocks.createResponse()

      await User.routes['/login'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.token)
    })

    it('should set change password token', async() => {
      const userEmail = 'test@test.org'
      await UserController.createUser(userEmail, 'test')
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: '/set-password',
        body: { email: userEmail }
      })
      const mockRes = httpMocks.createResponse()
      await User.routes['/set-password'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.message).toBeTruthy()
    })

    it('should change password token with given token', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: '/set-password/:token',
        body: {
          password: 'pass'
        },
        params: {
          token: 'not-a-valid-token'
        }
      })
      const mockRes = httpMocks.createResponse()
      await User.routes['/set-password'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBeTruthy()
    })

    it('should set check a token', async() => {
      const mockReq = httpMocks.createRequest({
        method: 'post',
        url: '/check-token',
        body: {
          token: 'not-a-valid-token'
        }
      })
      const mockRes = httpMocks.createResponse()
      await User.routes['/set-password'].post(mockReq, mockRes)
      const actualResponseBody = mockRes._getData()
      expect(actualResponseBody.error).toBeTruthy()
    })
  })
})
