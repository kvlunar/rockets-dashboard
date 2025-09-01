import { emit } from '@riddance/service/test/event'
import { getRocketState } from '../lib/schema.js'
import { createRocketId, createLaunchedEvent, createExplodedEvent } from './lib/test-helpers.js'
import assert from 'node:assert/strict'

describe('exploded', () => {
    it('should set rocket status to exploded', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000), 'msg-1')
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE'),
            'msg-2',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.status, 'exploded')
        assert.strictEqual(rocket.explosionReason, 'PRESSURE_VESSEL_FAILURE')
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000), 'msg-1')
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE'),
            'msg-2',
        )
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE'),
            'msg-2',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.status, 'exploded')
    })

    it('should ignore explosion for unknown rocket', async () => {
        const rocketId = createRocketId()

        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE'),
            'msg-1',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.strictEqual(rocket, undefined)
    })
})
