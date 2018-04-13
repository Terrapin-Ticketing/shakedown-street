import routes from './src'
import { isEmptyObject } from './src/_utils'

describe('root', () => {
  it('should test if routes register their routes definition correctly', async() => {
    for (let route in routes) {
      let routeDef = routes[route]
      expect(routeDef && !isEmptyObject(routeDef)).toBeTruthy()
    }
  })
})
