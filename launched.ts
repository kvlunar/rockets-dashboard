import { on } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'launched', async (context, subject, event) => {
    const { meta, type, launchSpeed, mission } = event as {
        meta: { sequence: number; timestamp: string }
        type: string
        launchSpeed: number
        mission: string
    }

    const existingRocket = await getRocketState(context, subject)

    if (existingRocket?.processedMessageIds.includes(meta.sequence)) {
        return
    }

    const processedMessageIds = existingRocket?.processedMessageIds ?? []
    processedMessageIds.push(meta.sequence)

    const rocketState = {
        id: subject,
        rocketType: type,
        currentSpeed: launchSpeed,
        mission,
        status: 'active' as const,
        launchTime: new Date(meta.timestamp),
        processedMessageIds,
    }

    await updateRocketState(context, subject, rocketState)
})
