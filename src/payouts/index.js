import routes from './routes'
import controller from './controller'
import model from './model'
import { addRoutes } from '../_utils/add-route'

export default {
  routes: addRoutes(routes),
  controller,
  model
}
