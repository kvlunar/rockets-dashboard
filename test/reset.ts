import { emit } from '@riddance/service/test/event'
import { request } from '@riddance/service/test/http'
import assert from 'node:assert/strict'
import { createLaunchedEvent, createRocketId } from './lib/events.js'

describe('reset', () => {
    it('should delete all rockets', async () => {
        const rocket1Id = createRocketId()
        const rocket2Id = createRocketId()

        await emit(
            'rocket',
            'launched',
            rocket1Id,
            createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'),
            'msg-1',
        )
        await emit(
            'rocket',
            'launched',
            rocket2Id,
            createLaunchedEvent('Falcon-Heavy', 2000, 'MARS'),
            'msg-2',
        )
        await emit('rocket', 'speed-increased', rocket1Id, { by: 200 }, 'msg-3')
        await emit('rocket', 'exploded', rocket2Id, { reason: 'PRESSURE_VESSEL_FAILURE' }, 'msg-4')

        await request({ method: 'POST', uri: 'reset' })

        const response = await request({ uri: '' })

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(response.body, [])
    })
})
