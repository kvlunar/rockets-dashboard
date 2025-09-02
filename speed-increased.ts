import { on } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'speed-increased', async (context, subject, event) => {
    const { meta, by } = event as { meta: { sequence: number }; by: number }

    const rocket = await getRocketState(context, subject)

    if (!rocket) {
        throw new Error('No rocket yet.')
    }
    if (rocket.processedMessageIds.includes(meta.sequence)) {
        return
    }
    if (rocket.processedMessageIds.at(-1) !== meta.sequence - 1) {
        throw new Error('Not ready for event.')
    }
    if (rocket.status === 'exploded') {
        return
    }

    rocket.processedMessageIds.push(meta.sequence)
    if (rocket.processedMessageIds.length === 33) {
        rocket.processedMessageIds.splice(0, 1)
    }
    rocket.currentSpeed = rocket.currentSpeed + by

    await updateRocketState(context, subject, rocket)
})
