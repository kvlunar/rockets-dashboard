import { on } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'speed-decreased', async (context, subject, event) => {
    const { meta, by } = event as { meta: { sequence: number }; by: number }

    const rocket = await getRocketState(context, subject)

    if (!rocket) {
        return
    }

    if (rocket.processedMessageIds.includes(meta.sequence)) {
        return
    }

    if (rocket.status === 'exploded') {
        return
    }

    rocket.processedMessageIds.push(meta.sequence)
    rocket.currentSpeed = Math.max(0, rocket.currentSpeed - by)

    await updateRocketState(context, subject, rocket)
})
