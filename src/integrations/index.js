import CinciRegister from './cinci-register'
import MissionTix from './mission-tix'

export default {
  [CinciRegister.integrationType]: CinciRegister,
  [MissionTix.integrationType]: MissionTix
}
