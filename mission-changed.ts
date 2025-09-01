import { on, objectSpreadable } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'mission-changed', async (context, subject, event, _timestamp, messageId) => {
    const { newMission } = objectSpreadable(event)

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
    rocket.mission = newMission as string

    await updateRocketState(context, subject, rocket)
})
