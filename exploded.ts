import { on } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'exploded', async (context, subject, event) => {
    const { meta, reason } = event as { meta: { sequence: number }; reason: string }

    const rocket = await getRocketState(context, subject)

    if (!rocket) {
        return
    }

    if (rocket.processedMessageIds.includes(meta.sequence)) {
        return
    }

    rocket.processedMessageIds.push(meta.sequence)
    rocket.status = 'exploded'
    rocket.explosionReason = reason

    await updateRocketState(context, subject, rocket)
})
