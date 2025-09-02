import { post } from '@riddance/service/http'
import { deleteAllRockets } from './lib/schema.js'

post('reset', context => deleteAllRockets(context))
