import { emit } from '@riddance/service/test/event'
import assert from 'node:assert/strict'
import { getRocketState } from '../lib/schema.js'
import {
    createExplodedEvent,
    createLaunchedEvent,
    createRocketId,
    createSpeedIncreasedEvent,
} from './lib/events.js'

describe('speed-increased', () => {
    it('should increase rocket speed', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit('rocket', 'speed-increased', rocketId, createSpeedIncreasedEvent(200, 1))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 1200)
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit('rocket', 'speed-increased', rocketId, createSpeedIncreasedEvent(200, 1))
        await emit('rocket', 'speed-increased', rocketId, createSpeedIncreasedEvent(200, 1))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 1200)
    })

    it('should ignore speed increase for unknown rocket', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'speed-increased', rocketId, createSpeedIncreasedEvent(200, 1))

        const rocket = await getRocketState({}, rocketId)
        assert.strictEqual(rocket, undefined)
    })

    it('should ignore speed increase for exploded rocket', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000))
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 1),
        )
        await emit('rocket', 'speed-increased', rocketId, createSpeedIncreasedEvent(200, 2))

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 1000)
        assert.strictEqual(rocket.status, 'exploded')
    })
})
