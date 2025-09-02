import { emit } from '@riddance/service/test/event'
import assert from 'node:assert/strict'
import { getRocketState } from '../lib/schema.js'
import {
    createExplodedEvent,
    createLaunchedEvent,
    createMissionChangedEvent,
    createRocketId,
} from './lib/events.js'

describe('mission-changed', () => {
    it('should update rocket mission', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'))
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION', 1),
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.mission, 'MARS_MISSION')
    })

    it('should be idempotent', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'))
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION', 1),
        )
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION', 1),
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
            createMissionChangedEvent('MARS_MISSION', 1),
        )

        const rocket = await getRocketState({}, rocketId)
        assert.strictEqual(rocket, undefined)
    })

    it('should ignore mission change for exploded rocket', async () => {
        const rocketId = createRocketId()

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'))
        await emit(
            'rocket',
            'exploded',
            rocketId,
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 1),
        )
        await emit(
            'rocket',
            'mission-changed',
            rocketId,
            createMissionChangedEvent('MARS_MISSION', 2),
        )

        const rocket = await getRocketState({}, rocketId)
        assert.ok(rocket)
        assert.strictEqual(rocket.mission, 'ARTEMIS')
        assert.strictEqual(rocket.status, 'exploded')
    })
})
