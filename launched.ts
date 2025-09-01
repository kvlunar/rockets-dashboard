import { on, objectSpreadable } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'launched', async (context, subject, event, timestamp, messageId) => {
    const { type, launchSpeed, mission } = objectSpreadable(event)

    const existingRocket = await getRocketState(context, subject)

    if (existingRocket?.processedMessageIds.includes(messageId)) {
        return
    }

    const processedMessageIds = existingRocket?.processedMessageIds ?? []
    processedMessageIds.push(messageId)

    const rocketState = {
        id: subject,
        type: type as string,
        currentSpeed: launchSpeed as number,
        mission: mission as string,
        status: 'active' as const,
        launchTime: new Date(timestamp),
        processedMessageIds,
    }

    await updateRocketState(context, subject, rocketState)
})
