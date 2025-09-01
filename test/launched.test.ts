import { emit } from '@riddance/service/test/event'
import { getRocketState } from '../lib/schema.js'
import { createRocketId, createLaunchedEvent } from './lib/test-helpers.js'
import assert from 'node:assert/strict'

describe('launched', () => {
    it('should create new rocket state', async () => {
        const rocketId = createRocketId()
        const launchEvent = createLaunchedEvent('Falcon-9', 1500, 'ARTEMIS')

        await emit('rocket', 'launched', rocketId, launchEvent, 'msg-1')

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.id, rocketId)
        assert.strictEqual(rocket.type, 'Falcon-9')
        assert.strictEqual(rocket.currentSpeed, 1500)
        assert.strictEqual(rocket.mission, 'ARTEMIS')
        assert.strictEqual(rocket.status, 'active')
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()
        const launchEvent = createLaunchedEvent('Falcon-9', 1500, 'ARTEMIS')

        await emit('rocket', 'launched', rocketId, launchEvent, 'msg-1')
        await emit('rocket', 'launched', rocketId, launchEvent, 'msg-1')

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.currentSpeed, 1500)
    })

    it('should handle multiple different launch events for same rocket', async () => {
        const rocketId = createRocketId()
        const launchEvent1 = createLaunchedEvent('Falcon-9', 1500, 'ARTEMIS')
        const launchEvent2 = createLaunchedEvent('Falcon-Heavy', 2000, 'MARS')

        await emit('rocket', 'launched', rocketId, launchEvent1, 'msg-1')
        await emit('rocket', 'launched', rocketId, launchEvent2, 'msg-2')

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
    })
})
