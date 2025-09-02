import { allowErrorLogs, emit } from '@riddance/service/test/event'
import assert from 'node:assert/strict'
import { getRocketState } from '../lib/schema.js'
import {
    createExplodedEvent,
    createLaunchedEvent,
    createRocketId,
    createSpeedDecreasedEvent,
} from './lib/events.js'

describe('speed-decreased', () => {
    it('should decrease rocket speed', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit('rocket', 'speed-decreased', rocketId, createSpeedDecreasedEvent(200, 1))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 800)
    })

    it('should not allow speed to go below zero', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit('rocket', 'speed-decreased', rocketId, createSpeedDecreasedEvent(1200, 1))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 0)
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit('rocket', 'speed-decreased', rocketId, createSpeedDecreasedEvent(200, 1))
        await emit('rocket', 'speed-decreased', rocketId, createSpeedDecreasedEvent(200, 1))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 800)
    })

    it('should ignore speed decrease for unknown rocket', async () => {
        const rocketId = createRocketId()

        using _ = allowErrorLogs()
        const noRetry = await emit(
            'rocket',
            'speed-decreased',
            rocketId,
            createSpeedDecreasedEvent(200, 1),
        )
        assert.ok(!noRetry)

        const rocket = await getRocketState({}, rocketId)
        assert.strictEqual(rocket, undefined)
    })

    it('should ignore speed decrease for exploded rocket', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 1),
        )
        await emit('rocket', 'speed-decreased', rocketId, createSpeedDecreasedEvent(200, 2))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 1000)
        assert.strictEqual(rocket.status, 'exploded')
    })
})
