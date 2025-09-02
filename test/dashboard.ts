import {
    allowErrorLogs,
    clearEmitted,
    clearLoggedEntries,
    emit,
} from '@riddance/service/test/event'
import { request } from '@riddance/service/test/http'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
    createExplodedEvent,
    createLaunchedEvent,
    createRocketId,
    createSpeedDecreasedEvent,
    createSpeedIncreasedEvent,
} from './lib/events.js'

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
            createExplodedEvent('PRESSURE_VESSEL_FAILURE', 1),
        )

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

        await emit('rocket', 'launched', rocketId, createLaunchedEvent('Falcon-9', 1000, 'ARTEMIS'))

        const response = await request({ uri: '' })

        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.body[0].explosionReason, undefined)
    })

    it('should handle out-of-order', async () => {
        const subject = createRocketId()
        await emitInAnyOrderAndWithDuplicates(
            async () => {
                await request({ method: 'POST', uri: 'reset' })
            },
            [
                {
                    topic: 'rocket',
                    type: 'launched',
                    subject,
                    data: createLaunchedEvent('Falcon-Heavy', 2000, 'MARS'),
                },
                {
                    topic: 'rocket',
                    type: 'speed-decreased',
                    subject,
                    data: createSpeedDecreasedEvent(1500, 1),
                },
                {
                    topic: 'rocket',
                    type: 'exploded',
                    subject,
                    data: createExplodedEvent('PRESSURE_VESSEL_FAILURE', 2),
                },
            ],
            async () => {
                const response = await request({ uri: '' })
                const [rocket] = response.body
                assert.strictEqual(rocket.currentSpeed, 500)
                assert.strictEqual(rocket.status, 'exploded')
            },
        )
    })
})

type EventData = {
    topic: string
    type: string
    subject: string
    data: any
}

export async function emitInAnyOrderAndWithDuplicates(
    setup: (() => Promise<void>) | undefined,
    events: EventData[],
    expect: (() => Promise<void>) | undefined,
) {
    for (const duplicated of withDuplicates(
        events.map(e => ({ ...e, messageId: randomUUID(), time: new Date() })),
    )) {
        for (const anyOrder of inAnyOrder(duplicated)) {
            const emitted = []
            const failed = []
            const failedAgain = []
            const failedAgainAndAgain = []
            clearLoggedEntries()
            clearEmitted()
            if (setup) {
                await setup()
            }
            using _ = allowErrorLogs()
            try {
                for (const e of anyOrder) {
                    emitted.push(e)
                    if (!(await emit(e.topic, e.type, e.subject, e.data, e.messageId))) {
                        failed.push(e)
                    }
                }
                for (const e of failed) {
                    emitted.push(e)
                    if (!(await emit(e.topic, e.type, e.subject, e.data, e.messageId))) {
                        failedAgain.push(e)
                    }
                }
                for (const e of failedAgain) {
                    emitted.push(e)
                    if (!(await emit(e.topic, e.type, e.subject, e.data, e.messageId))) {
                        failedAgainAndAgain.push(e)
                    }
                }
                for (const e of failedAgainAndAgain) {
                    emitted.push(e)
                    await emit(e.topic, e.type, e.subject, e.data, e.messageId)
                }
                if (expect) {
                    await expect()
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(
                    `Failed event sequence ${emitted.map(e => `${e.topic}.${e.type}`).join(', ')}`,
                    error,
                )
                // eslint-disable-next-line no-console
                console.error(
                    `Reproduce test case by doing
${emitted.map(e => `    await emit('${e.topic}', '${e.type}', '${e.subject}', ${JSON.stringify(e.data)}, '${e.messageId}', new Date(${e.time.getTime()}))`).join('\r\n')}
    assert...`,
                    error,
                )
                throw error
            }
        }
    }
}

function withDuplicates<T>(events: T[]) {
    return [events, ...events.map(e => [...events, e])]
}

function inAnyOrder<T>(events: T[]): T[][] {
    if (events.length < 2) {
        return [events]
    }
    const combinations: T[][] = []
    for (let ix = 0; ix !== events.length; ++ix) {
        const rest = [...events]
        const [single] = rest.splice(ix, 1)
        inAnyOrder(rest).forEach(r => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            combinations.push([single!, ...r])
        })
    }
    return combinations
}
