import { on, objectSpreadable } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'exploded', async (context, subject, event, _timestamp, messageId) => {
    const { reason } = objectSpreadable(event)

    const rocket = await getRocketState(context, subject)

    if (!rocket) {
        return
    }

    if (rocket.processedMessageIds.includes(messageId)) {
        return
    }

    rocket.processedMessageIds.push(messageId)
    rocket.status = 'exploded'
    rocket.explosionReason = reason as string

    await updateRocketState(context, subject, rocket)
})
