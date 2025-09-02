import { allowErrorLogs, emit } from '@riddance/service/test/event'
import assert from 'node:assert/strict'
import { getRocketState } from '../lib/schema.js'
import { createExplodedEvent, createLaunchedEvent, createRocketId } from './lib/events.js'

describe('exploded', () => {
    it('should set rocket status to exploded', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 1),
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.status, 'exploded')
        assert.strictEqual(rocket.explosionReason, 'PRESSURE_VESSEL_FAILURE')
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 1),
        )
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 2),
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.status, 'exploded')
    })

    it('should ignore explosion for unknown rocket', async () => {
        const rocketId = createRocketId()

        using _ = allowErrorLogs()
        const noRetry = await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 0),
        )

        assert.ok(!noRetry)
        const rocket = await getRocketState({}, rocketId)
        assert.strictEqual(rocket, undefined)
    })
})
