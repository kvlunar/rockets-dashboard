import { on } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'exploded', async (context, subject, event) => {
    const { meta, reason } = event as { meta: { sequence: number }; reason: string }

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

    rocket.processedMessageIds.push(meta.sequence)
    rocket.status = 'exploded'
    rocket.explosionReason = reason

    await updateRocketState(context, subject, rocket)
})
