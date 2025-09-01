import { on, objectSpreadable } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'speed-increased', async (context, subject, event, _timestamp, messageId) => {
    const { by } = objectSpreadable(event)

    const rocket = await getRocketState(context, subject)

    if (!rocket) {
        return
    }

    if (rocket.processedMessageIds.includes(messageId)) {
        return
    }

    if (rocket.status === 'exploded') {
        return
    }

    rocket.processedMessageIds.push(messageId)
    rocket.currentSpeed = rocket.currentSpeed + (by as number)

    await updateRocketState(context, subject, rocket)
})
