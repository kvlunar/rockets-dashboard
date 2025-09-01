import { emit } from '@riddance/service/test/event'
import assert from 'node:assert/strict'
import { getRocketState } from '../lib/schema.js'
import { createLaunchedEvent, createMissionChangedEvent, createRocketId } from './lib/events.js'

describe('mission-changed', () => {
    it('should update rocket mission', async () => {
        const rocketId = createRocketId()

        await emit(
            'rocket',
            'launched',
            rocketId,
            createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'),
            'msg-1',
        )
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION'),
            'msg-2',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.mission, 'MARS_MISSION')
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()

        await emit(
            'rocket',
            'launched',
            rocketId,
            createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'),
            'msg-1',
        )
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION'),
            'msg-2',
        )
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION'),
            'msg-2',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.mission, 'MARS_MISSION')
    })

    it('should ignore mission change for unknown rocket', async () => {
        const rocketId = createRocketId()

        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION'),
            'msg-1',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.strictEqual(rocket, undefined)
    })

    it('should ignore mission change for exploded rocket', async () => {
        const rocketId = createRocketId()

        await emit(
            'rocket',
            'launched',
            rocketId,
            createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'),
            'msg-1',
        )
        await emit('rocket', 'exploded', rocketId, { reason: 'PRESSURE_VESSEL_FAILURE' }, 'msg-2')
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION'),
            'msg-3',
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.mission, 'ARTEMIS')
        assert.strictEqual(rocket.status, 'exploded')
    })
})
