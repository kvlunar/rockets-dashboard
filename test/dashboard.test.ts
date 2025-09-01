import { request } from '@riddance/service/test/http'
import { emit } from '@riddance/service/test/event'
import { createRocketId, createLaunchedEvent } from './lib/test-helpers.js'
import assert from 'node:assert/strict'

describe('dashboard', () => {
    it('should return empty array when no rockets', async () => {
        const response = await request({ uri: '' })

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(response.body, [])
    })

    it('should return all rockets', async () => {
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

        const response = await request({ uri: '' })

        assert.strictEqual(response.status, 200)
        assert.strictEqual(Array.isArray(response.body), true)
        assert.strictEqual(response.body.length, 2)

        const rocket1 = response.body.find((r: any) => r.id === rocket1Id)
        const rocket2 = response.body.find((r: any) => r.id === rocket2Id)

        assert.ok(rocket1)
        assert.strictEqual(rocket1.type, 'Falcon-9')
        assert.strictEqual(rocket1.currentSpeed, 1200)
        assert.strictEqual(rocket1.mission, 'ARTEMIS')
        assert.strictEqual(rocket1.status, 'active')
        assert.ok(rocket1.launchTime)

        assert.ok(rocket2)
        assert.strictEqual(rocket2.type, 'Falcon-Heavy')
        assert.strictEqual(rocket2.currentSpeed, 2000)
        assert.strictEqual(rocket2.mission, 'MARS')
        assert.strictEqual(rocket2.status, 'exploded')
        assert.ok(rocket2.launchTime)
        assert.strictEqual(rocket2.explosionReason, 'PRESSURE_VESSEL_FAILURE')
    })

    it('should handle rockets with no explosion reason', async () => {
        const rocketId = createRocketId()

        await emit(
            'rocket',
            'launched',
            rocketId,
            createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'),
            'msg-1',
        )

        const response = await request({ uri: '' })

        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.body[0].explosionReason, undefined)
    })
})
