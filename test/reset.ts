import { emit } from '@riddance/service/test/event'
import { request } from '@riddance/service/test/http'
import assert from 'node:assert/strict'
import {
    createExplodedEvent,
    createLaunchedEvent,
    createRocketId,
    createSpeedIncreasedEvent,
} from './lib/events.js'

describe('reset', () => {
    it('should delete all rockets', async () => {
        const rocket1Id = createRocketId()
        const rocket2Id = createRocketId()

        await emit(
            'rocket',
            'launched',
            rocket1Id,
            createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'),
        )
        await emit(
            'rocket',
            'launched',
            rocket2Id,
            createLaunchedEvent('Falcon-Heavy', 2000, 'MARS'),
        )
        await emit('rocket', 'speed-increased', rocket1Id, createSpeedIncreasedEvent(200, 1))
        await emit(
            'rocket',
            'exploded',
            rocket2Id,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 2),
        )

        await request({ method: 'POST', uri: 'reset' })

        const response = await request({ uri: '' })

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(response.body, [])
    })
})
